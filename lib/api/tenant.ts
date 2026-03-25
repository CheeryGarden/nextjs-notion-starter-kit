/**
 * @file tenant.ts
 * @brief Multi-tenant isolation and permission management for 10 third-party platforms
 * @version 1.0.0
 * @date 2026-03-25
 */

export type PlanLevel = 'plan1' | 'plan2' | 'plan3' | 'plan4'

export interface TenantConfig {
  appId: string
  name: string
  plan: PlanLevel
  allowedDeviceIds: string[]
  rateLimitPerSecond: number
  maxWebhooks: number
  webhookPushIntervalMs: number
  isActive: boolean
  createdAt: number
}

const PLAN_CAPABILITIES: Record<PlanLevel, { video: boolean; ai: boolean; maxDevices: number }> = {
  plan1: { video: false, ai: false, maxDevices: 600 },
  plan2: { video: false, ai: false, maxDevices: 600 },
  plan3: { video: true, ai: true, maxDevices: 2000 },
  plan4: { video: true, ai: true, maxDevices: 2000 }
}

/**
 * @brief Resolves tenant configuration from appId.
 *        Production: load from database / config center.
 * @param[in] appId the application identifier
 * @return tenant config or null if not found
 */
export async function getTenantConfig(
  appId: string
): Promise<TenantConfig | null> {
  // TODO: Replace with database / config center lookup
  // Supports up to 10 concurrent third-party platforms
  const tenantJson = process.env[`TENANT_${appId}`]
  if (!tenantJson) {
    return null
  }

  try {
    return JSON.parse(tenantJson) as TenantConfig
  } catch {
    return null
  }
}

/**
 * @brief Checks if a tenant has access to a specific device
 * @param[in] tenant the tenant configuration
 * @param[in] deviceId the device to check
 * @return true if access is allowed
 */
export function canAccessDevice(
  tenant: TenantConfig,
  deviceId: string
): boolean {
  return tenant.allowedDeviceIds.includes(deviceId)
}

/**
 * @brief Checks if a tenant's plan supports video features
 * @param[in] tenant the tenant configuration
 * @return true if video is available
 */
export function hasVideoAccess(tenant: TenantConfig): boolean {
  return PLAN_CAPABILITIES[tenant.plan]?.video ?? false
}

/**
 * @brief Checks if a tenant's plan supports AI features (ADAS/DMS/BSD control)
 * @param[in] tenant the tenant configuration
 * @return true if AI control is available
 */
export function hasAIAccess(tenant: TenantConfig): boolean {
  return PLAN_CAPABILITIES[tenant.plan]?.ai ?? false
}

/**
 * @brief Gets the max device count for a tenant's plan
 * @param[in] tenant the tenant configuration
 * @return max devices allowed
 */
export function getMaxDevices(tenant: TenantConfig): number {
  return PLAN_CAPABILITIES[tenant.plan]?.maxDevices ?? 600
}

/**
 * @brief Filters a list of device IDs to only those the tenant can access
 * @param[in] tenant the tenant configuration
 * @param[in] deviceIds device IDs to filter
 * @return filtered device IDs
 */
export function filterAllowedDevices(
  tenant: TenantConfig,
  deviceIds: string[]
): string[] {
  const allowed = new Set(tenant.allowedDeviceIds)
  return deviceIds.filter((id) => allowed.has(id))
}
