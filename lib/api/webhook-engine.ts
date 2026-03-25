/**
 * @file webhook-engine.ts
 * @brief Webhook push engine with fan-out delivery to 10 third-party platforms
 *        Supports second-level latency with micro-batch merging and per-tenant isolation
 * @version 1.0.0
 * @date 2026-03-25
 */
import crypto from 'crypto'

import {
  WebhookConfig,
  WebhookDeliveryLog,
  WebhookEventType
} from './types'

/* ---------------------------------------------------------------------------
 * Configuration
 * --------------------------------------------------------------------------- */

interface EngineConfig {
  maxConcurrentPerTenant: number
  deliveryTimeoutMs: number
  defaultBatchIntervalMs: number
  maxRetries: number
  baseRetryDelayMs: number
}

const ENGINE_CONFIG: EngineConfig = {
  maxConcurrentPerTenant: 20,
  deliveryTimeoutMs: 5_000,
  defaultBatchIntervalMs: 1_000,
  maxRetries: 3,
  baseRetryDelayMs: 1_000
}

/* ---------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------- */

export interface WebhookEvent {
  eventType: WebhookEventType
  deviceId: string
  payload: Record<string, unknown>
  timestamp: number
}

interface TenantDeliveryState {
  activeDeliveries: number
  circuitOpen: boolean
  circuitOpenUntil: number
  consecutiveFailures: number
  batchBuffer: WebhookEvent[]
  batchTimer: ReturnType<typeof setTimeout> | null
}

/* ---------------------------------------------------------------------------
 * In-memory state (production: use Redis Streams)
 * --------------------------------------------------------------------------- */

const tenantStates = new Map<string, TenantDeliveryState>()
const registeredWebhooks = new Map<string, WebhookConfig[]>()
const deliveryLogs: WebhookDeliveryLog[] = []

/**
 * @brief Initializes delivery state for a tenant
 * @param[in] appId tenant application ID
 * @return tenant delivery state
 */
function getOrCreateTenantState(appId: string): TenantDeliveryState {
  let state = tenantStates.get(appId)
  if (!state) {
    state = {
      activeDeliveries: 0,
      circuitOpen: false,
      circuitOpenUntil: 0,
      consecutiveFailures: 0,
      batchBuffer: [],
      batchTimer: null
    }
    tenantStates.set(appId, state)
  }
  return state
}

/* ---------------------------------------------------------------------------
 * Core engine functions
 * --------------------------------------------------------------------------- */

/**
 * @brief Publishes an event to all registered webhooks (fan-out to up to 10 platforms)
 * @param[in] event the event to publish
 * @return none
 * @note Each tenant gets independent delivery with circuit breaker isolation
 */
export async function publishEvent(event: WebhookEvent): Promise<void> {
  const allWebhooks = Array.from(registeredWebhooks.entries())

  const deliveryPromises = allWebhooks.map(([appId, webhooks]) => {
    const matching = webhooks.filter(
      (wh) => wh.isActive && wh.events.includes(event.eventType)
    )
    return Promise.all(
      matching.map((wh) => enqueueForDelivery(appId, wh, event))
    )
  })

  await Promise.allSettled(deliveryPromises)
}

/**
 * @brief Enqueues an event for batch delivery to a specific webhook
 * @param[in] appId tenant application ID
 * @param[in] webhook webhook configuration
 * @param[in] event the event to deliver
 * @return none
 * @note High-frequency events (telematics.snapshot) are micro-batched
 */
async function enqueueForDelivery(
  appId: string,
  webhook: WebhookConfig,
  event: WebhookEvent
): Promise<void> {
  const state = getOrCreateTenantState(appId)

  if (state.circuitOpen && Date.now() < state.circuitOpenUntil) {
    return
  }

  if (event.eventType === 'telematics.snapshot') {
    state.batchBuffer.push(event)
    if (!state.batchTimer) {
      state.batchTimer = setTimeout(() => {
        const batch = [...state.batchBuffer]
        state.batchBuffer = []
        state.batchTimer = null
        deliverBatch(appId, webhook, batch).catch(() => {})
      }, ENGINE_CONFIG.defaultBatchIntervalMs)
    }
    return
  }

  await deliverSingle(appId, webhook, event)
}

/**
 * @brief Delivers a batch of events to a webhook endpoint
 * @param[in] appId tenant application ID
 * @param[in] webhook webhook configuration
 * @param[in] events batched events
 * @return none
 */
async function deliverBatch(
  appId: string,
  webhook: WebhookConfig,
  events: WebhookEvent[]
): Promise<void> {
  if (events.length === 0) {
    return
  }

  const payload = {
    type: 'batch',
    events,
    count: events.length,
    timestamp: Date.now()
  }

  await attemptDelivery(appId, webhook, payload, events[0].eventType)
}

/**
 * @brief Delivers a single event to a webhook endpoint
 * @param[in] appId tenant application ID
 * @param[in] webhook webhook configuration
 * @param[in] event the event to deliver
 * @return none
 */
async function deliverSingle(
  appId: string,
  webhook: WebhookConfig,
  event: WebhookEvent
): Promise<void> {
  const payload = {
    type: 'single',
    event,
    timestamp: Date.now()
  }

  await attemptDelivery(appId, webhook, payload, event.eventType)
}

/**
 * @brief Attempts HTTP delivery with retry and circuit breaker
 * @param[in] appId tenant application ID
 * @param[in] webhook webhook configuration
 * @param[in] payload serialized payload
 * @param[in] eventType event type for logging
 * @return none
 * @note Uses exponential backoff on failure, per-tenant circuit breaker
 */
async function attemptDelivery(
  appId: string,
  webhook: WebhookConfig,
  payload: Record<string, unknown>,
  eventType: WebhookEventType
): Promise<void> {
  const state = getOrCreateTenantState(appId)
  const maxRetries = webhook.retryPolicy?.maxRetries ?? ENGINE_CONFIG.maxRetries

  if (state.activeDeliveries >= ENGINE_CONFIG.maxConcurrentPerTenant) {
    recordDeliveryLog(webhook.webhookId, eventType, payload, null, null, 0, false)
    return
  }

  state.activeDeliveries++

  let lastStatusCode: number | null = null
  let lastResponseBody: string | null = null
  let success = false

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay =
          ENGINE_CONFIG.baseRetryDelayMs *
          Math.pow(webhook.retryPolicy?.backoffMultiplier ?? 2, attempt - 1)
        await sleep(delay)
      }

      try {
        const bodyStr = JSON.stringify(payload)
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(bodyStr)
          .digest('hex')

        const controller = new AbortController()
        const timer = setTimeout(
          () => controller.abort(),
          ENGINE_CONFIG.deliveryTimeoutMs
        )

        const res = await fetch(webhook.url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Id': webhook.webhookId,
            'X-Event-Type': eventType,
            'X-Delivery-Attempt': String(attempt + 1)
          },
          body: bodyStr
        })

        clearTimeout(timer)

        lastStatusCode = res.status
        lastResponseBody = await res.text().catch(() => null)

        if (res.ok) {
          success = true
          state.consecutiveFailures = 0
          if (state.circuitOpen) {
            state.circuitOpen = false
          }
          break
        }
      } catch {
        lastStatusCode = null
        lastResponseBody = null
      }
    }

    if (!success) {
      state.consecutiveFailures++
      if (state.consecutiveFailures >= 10) {
        state.circuitOpen = true
        state.circuitOpenUntil = Date.now() + 60_000
        state.consecutiveFailures = 0
      }
    }

    recordDeliveryLog(
      webhook.webhookId,
      eventType,
      payload,
      lastStatusCode,
      lastResponseBody,
      maxRetries + 1,
      success
    )
  } finally {
    state.activeDeliveries--
  }
}

/**
 * @brief Records a webhook delivery log entry
 * @param[in] webhookId webhook identifier
 * @param[in] eventType event type
 * @param[in] payload delivered payload
 * @param[in] statusCode HTTP status code (null if network error)
 * @param[in] responseBody response body (null if network error)
 * @param[in] attempts total delivery attempts
 * @param[in] success whether delivery succeeded
 * @return none
 */
function recordDeliveryLog(
  webhookId: string,
  eventType: WebhookEventType,
  payload: Record<string, unknown>,
  statusCode: number | null,
  responseBody: string | null,
  attempts: number,
  success: boolean
): void {
  const log: WebhookDeliveryLog = {
    deliveryId: crypto.randomUUID(),
    webhookId,
    eventType,
    payload,
    statusCode,
    responseBody:
      responseBody && responseBody.length > 1024
        ? responseBody.slice(0, 1024)
        : responseBody,
    attempts,
    success,
    createdAt: Date.now(),
    lastAttemptAt: Date.now()
  }

  deliveryLogs.push(log)

  const MAX_LOGS = 100_000
  if (deliveryLogs.length > MAX_LOGS) {
    deliveryLogs.splice(0, deliveryLogs.length - MAX_LOGS)
  }
}

/* ---------------------------------------------------------------------------
 * Webhook registration (called by Webhook management APIs)
 * --------------------------------------------------------------------------- */

/**
 * @brief Registers a webhook for a tenant
 * @param[in] appId tenant application ID
 * @param[in] webhook webhook configuration
 * @return none
 */
export function registerWebhook(appId: string, webhook: WebhookConfig): void {
  const existing = registeredWebhooks.get(appId) || []
  existing.push(webhook)
  registeredWebhooks.set(appId, existing)
}

/**
 * @brief Removes a webhook registration
 * @param[in] appId tenant application ID
 * @param[in] webhookId webhook identifier to remove
 * @return none
 */
export function unregisterWebhook(appId: string, webhookId: string): void {
  const existing = registeredWebhooks.get(appId) || []
  registeredWebhooks.set(
    appId,
    existing.filter((wh) => wh.webhookId !== webhookId)
  )
}

/**
 * @brief Gets all registered webhooks for a tenant
 * @param[in] appId tenant application ID
 * @return webhook configurations
 */
export function getWebhooksForTenant(appId: string): WebhookConfig[] {
  return registeredWebhooks.get(appId) || []
}

/**
 * @brief Queries delivery logs for a webhook
 * @param[in] webhookId webhook identifier
 * @param[in] limit max number of logs to return
 * @return delivery logs
 */
export function getDeliveryLogs(
  webhookId: string,
  limit = 100
): WebhookDeliveryLog[] {
  return deliveryLogs
    .filter((log) => log.webhookId === webhookId)
    .slice(-limit)
}

/**
 * @brief Gets the circuit breaker state for a tenant
 * @param[in] appId tenant application ID
 * @return circuit state information
 */
export function getTenantCircuitState(
  appId: string
): { circuitOpen: boolean; consecutiveFailures: number; activeDeliveries: number } {
  const state = tenantStates.get(appId)
  if (!state) {
    return { circuitOpen: false, consecutiveFailures: 0, activeDeliveries: 0 }
  }
  return {
    circuitOpen: state.circuitOpen && Date.now() < state.circuitOpenUntil,
    consecutiveFailures: state.consecutiveFailures,
    activeDeliveries: state.activeDeliveries
  }
}

/* ---------------------------------------------------------------------------
 * Utility
 * --------------------------------------------------------------------------- */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
