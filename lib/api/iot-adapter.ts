/**
 * @file iot-adapter.ts
 * @brief HTTP adapter for connecting to the existing IoT platform
 * @version 1.0.0
 * @date 2026-03-25
 */
import {
  AlarmEvent,
  AlarmQueryParams,
  Device,
  DeviceListParams,
  GPSLocation,
  HarshEvent,
  HarshEventQueryParams,
  PaginatedResult,
  TelematicsSnapshot,
  TimeRangeParams,
  Trajectory
} from './types'

interface IoTAdapterConfig {
  baseUrl: string
  apiKey: string
  timeoutMs: number
  maxConcurrent: number
}

const DEFAULT_CONFIG: IoTAdapterConfig = {
  baseUrl: process.env.IOT_PLATFORM_BASE_URL || 'https://iot-platform.internal',
  apiKey: process.env.IOT_PLATFORM_API_KEY || '',
  timeoutMs: 10_000,
  maxConcurrent: 50
}

let activeFetches = 0

/**
 * @brief Performs a rate-limited HTTP request to the IoT platform
 * @param[in] path relative API path
 * @param[in] options fetch options
 * @return parsed JSON response
 */
async function iotFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = DEFAULT_CONFIG

  if (activeFetches >= config.maxConcurrent) {
    throw new Error('IoT adapter: max concurrent requests exceeded')
  }

  activeFetches++
  try {
    const url = `${config.baseUrl}${path}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), config.timeoutMs)

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        ...options.headers
      }
    })

    clearTimeout(timer)

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(
        `IoT platform error: ${res.status} ${res.statusText} - ${body}`
      )
    }

    return (await res.json()) as T
  } finally {
    activeFetches--
  }
}

/**
 * @brief Fetches device list from the IoT platform
 * @param[in] params pagination and filter parameters
 * @param[in] allowedDeviceIds tenant-scoped device IDs (for multi-tenant isolation)
 * @return paginated device list
 */
export async function fetchDevices(
  params: DeviceListParams,
  allowedDeviceIds?: string[]
): Promise<PaginatedResult<Device>> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    ...(params.status ? { status: params.status } : {}),
    ...(params.keyword ? { keyword: params.keyword } : {}),
    ...(allowedDeviceIds ? { deviceIds: allowedDeviceIds.join(',') } : {})
  })

  return iotFetch<PaginatedResult<Device>>(`/devices?${query}`)
}

/**
 * @brief Fetches a single device by ID
 * @param[in] deviceId the device identifier
 * @return device detail or null
 */
export async function fetchDevice(deviceId: string): Promise<Device | null> {
  try {
    return await iotFetch<Device>(`/devices/${encodeURIComponent(deviceId)}`)
  } catch {
    return null
  }
}

/**
 * @brief Fetches the latest telematics snapshot for a device
 * @param[in] deviceId the device identifier
 * @return latest telematics snapshot
 */
export async function fetchTelematicsSnapshot(
  deviceId: string
): Promise<TelematicsSnapshot | null> {
  try {
    return await iotFetch<TelematicsSnapshot>(
      `/telematics/${encodeURIComponent(deviceId)}/snapshot`
    )
  } catch {
    return null
  }
}

/**
 * @brief Fetches historical telematics data
 * @param[in] deviceId the device identifier
 * @param[in] timeRange start and end time
 * @param[in] page page number
 * @param[in] pageSize items per page
 * @return paginated telematics history
 */
export async function fetchTelematicsHistory(
  deviceId: string,
  timeRange: TimeRangeParams,
  page: number,
  pageSize: number
): Promise<PaginatedResult<TelematicsSnapshot>> {
  const query = new URLSearchParams({
    startTime: String(timeRange.startTime),
    endTime: String(timeRange.endTime),
    page: String(page),
    pageSize: String(pageSize)
  })

  return iotFetch<PaginatedResult<TelematicsSnapshot>>(
    `/telematics/${encodeURIComponent(deviceId)}/history?${query}`
  )
}

/**
 * @brief Fetches GPS trajectory for a device within a time range
 * @param[in] deviceId the device identifier
 * @param[in] timeRange start and end time
 * @return trajectory with GPS points
 */
export async function fetchTrajectory(
  deviceId: string,
  timeRange: TimeRangeParams
): Promise<Trajectory> {
  const query = new URLSearchParams({
    startTime: String(timeRange.startTime),
    endTime: String(timeRange.endTime)
  })

  return iotFetch<Trajectory>(
    `/telematics/${encodeURIComponent(deviceId)}/trajectory?${query}`
  )
}

/**
 * @brief Fetches alarm events from the IoT platform
 * @param[in] params query parameters
 * @param[in] allowedDeviceIds tenant-scoped device IDs
 * @return paginated alarm events
 */
export async function fetchAlarms(
  params: AlarmQueryParams,
  allowedDeviceIds?: string[]
): Promise<PaginatedResult<AlarmEvent>> {
  const query = new URLSearchParams({
    startTime: String(params.startTime),
    endTime: String(params.endTime),
    page: String(params.page),
    pageSize: String(params.pageSize),
    ...(params.deviceId ? { deviceId: params.deviceId } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.severity ? { severity: params.severity } : {}),
    ...(params.acknowledged !== undefined
      ? { acknowledged: String(params.acknowledged) }
      : {}),
    ...(allowedDeviceIds ? { deviceIds: allowedDeviceIds.join(',') } : {})
  })

  return iotFetch<PaginatedResult<AlarmEvent>>(`/alarms?${query}`)
}

/**
 * @brief Fetches a single alarm event by ID
 * @param[in] alarmId the alarm identifier
 * @return alarm event or null
 */
export async function fetchAlarm(alarmId: string): Promise<AlarmEvent | null> {
  try {
    return await iotFetch<AlarmEvent>(
      `/alarms/${encodeURIComponent(alarmId)}`
    )
  } catch {
    return null
  }
}

/**
 * @brief Fetches harsh driving events
 * @param[in] params query parameters
 * @return paginated harsh events
 */
export async function fetchHarshEvents(
  params: HarshEventQueryParams
): Promise<PaginatedResult<HarshEvent>> {
  const query = new URLSearchParams({
    deviceId: params.deviceId,
    startTime: String(params.startTime),
    endTime: String(params.endTime),
    page: String(params.page),
    pageSize: String(params.pageSize),
    ...(params.type ? { type: params.type } : {})
  })

  return iotFetch<PaginatedResult<HarshEvent>>(`/harsh-events?${query}`)
}

/**
 * @brief Fetches the latest GPS location for a device
 * @param[in] deviceId the device identifier
 * @return latest GPS location or null
 */
export async function fetchLatestLocation(
  deviceId: string
): Promise<GPSLocation | null> {
  try {
    return await iotFetch<GPSLocation>(
      `/devices/${encodeURIComponent(deviceId)}/location`
    )
  } catch {
    return null
  }
}
