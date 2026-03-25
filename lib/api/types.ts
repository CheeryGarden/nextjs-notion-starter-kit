/**
 * @file types.ts
 * @brief Type definitions for ofstar Connect Core Open API
 * @version 1.0.0
 * @date 2026-03-25
 */

/* ---------------------------------------------------------------------------
 * Common types
 * --------------------------------------------------------------------------- */

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T | null
  timestamp: number
  requestId: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TimeRangeParams {
  startTime: number
  endTime: number
}

/* ---------------------------------------------------------------------------
 * Authentication
 * --------------------------------------------------------------------------- */

export interface ApiCredentials {
  appId: string
  appSecret: string
}

export interface AccessToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

/* ---------------------------------------------------------------------------
 * Device types
 * --------------------------------------------------------------------------- */

export type DeviceStatus = 'online' | 'offline' | 'inactive'

export interface Device {
  deviceId: string
  deviceName: string
  deviceModel: string
  imei: string
  iccid: string
  status: DeviceStatus
  lastOnlineTime: number
  firmwareVersion: string
  createdAt: number
  updatedAt: number
  metadata: Record<string, string>
}

export interface DeviceListParams extends PaginationParams {
  status?: DeviceStatus
  keyword?: string
}

/* ---------------------------------------------------------------------------
 * GPS & Location data
 * --------------------------------------------------------------------------- */

export interface GPSLocation {
  deviceId: string
  latitude: number
  longitude: number
  altitude: number
  speed: number
  heading: number
  accuracy: number
  timestamp: number
}

export interface Trajectory {
  deviceId: string
  points: GPSLocation[]
  totalDistance: number
  startTime: number
  endTime: number
}

export interface TrajectoryQueryParams extends TimeRangeParams {
  deviceId: string
}

/* ---------------------------------------------------------------------------
 * Telematics data
 * --------------------------------------------------------------------------- */

export interface TelematicsSnapshot {
  deviceId: string
  timestamp: number
  gps: GPSLocation | null
  speed: number | null
  mileage: number | null
  cumulativeMileage: number | null
  idleSpeed: boolean | null
  rotation: RotationData | null
  fuelData: FuelData | null
  tirePressure: TirePressureData[] | null
  temperatureHumidity: TemperatureHumidityData | null
  obd: OBDData | null
  batteryVoltage: number | null
}

export interface RotationData {
  state: 'rotating' | 'stationary'
  direction: 'clockwise' | 'counterclockwise' | null
  speed: number
}

export interface FuelData {
  volume: number
  remainingPercentage: number
  consumptionRate: number
}

export interface TirePressureData {
  position: string
  pressure: number
  temperature: number
}

export interface TemperatureHumidityData {
  temperature: number
  humidity: number
}

export interface OBDData {
  vehicleSpeed: number | null
  engineSpeed: number | null
  engineCoolantTemperature: number | null
  engineCumulativeRunningTime: number | null
  faultCodes: string[]
}

/* ---------------------------------------------------------------------------
 * Harsh events / driving behavior
 * --------------------------------------------------------------------------- */

export type HarshEventType =
  | 'rapid_acceleration'
  | 'rapid_deceleration'
  | 'sharp_turn'
  | 'overspeed'

export interface HarshEvent {
  eventId: string
  deviceId: string
  type: HarshEventType
  severity: 'low' | 'medium' | 'high'
  location: GPSLocation
  speed: number
  timestamp: number
  details: Record<string, unknown>
}

export interface HarshEventQueryParams
  extends PaginationParams,
    TimeRangeParams {
  deviceId: string
  type?: HarshEventType
}

/* ---------------------------------------------------------------------------
 * RFID / Driver identification
 * --------------------------------------------------------------------------- */

export interface RFIDSwipeEvent {
  eventId: string
  deviceId: string
  cardId: string
  driverName: string | null
  timestamp: number
}

/* ---------------------------------------------------------------------------
 * Alarm / abnormal events
 * --------------------------------------------------------------------------- */

export type AlarmType =
  | 'lane_departure'
  | 'forward_collision'
  | 'pedestrian_collision'
  | 'following_distance'
  | 'fatigue_driving'
  | 'distracted_driving'
  | 'phone_usage'
  | 'smoking_detected'
  | 'seatbelt_unfastened'
  | 'max_overspeed'
  | 'lens_occlusion'
  | 'adas'
  | 'dms'
  | 'bsd'
  | 'abnormal'

export type AlarmSeverity = 'info' | 'warning' | 'critical'

export interface AlarmEvent {
  alarmId: string
  deviceId: string
  type: AlarmType
  severity: AlarmSeverity
  location: GPSLocation | null
  mediaUrl: string | null
  thumbnailUrl: string | null
  timestamp: number
  acknowledged: boolean
  details: Record<string, unknown>
}

export interface AlarmQueryParams extends PaginationParams, TimeRangeParams {
  deviceId?: string
  type?: AlarmType
  severity?: AlarmSeverity
  acknowledged?: boolean
}

/* ---------------------------------------------------------------------------
 * Video types
 * --------------------------------------------------------------------------- */

export type VideoChannel = 'front' | 'cabin' | 'left' | 'right' | 'rear'

export interface LiveStreamRequest {
  deviceId: string
  channel: VideoChannel
  resolution?: 'sd' | 'hd'
}

export interface LiveStreamResponse {
  streamUrl: string
  protocol: 'rtmp' | 'hls' | 'webrtc'
  expiresAt: number
  sessionId: string
}

export interface VideoPlaybackRequest extends TimeRangeParams {
  deviceId: string
  channel: VideoChannel
}

export interface VideoPlaybackResponse {
  playbackUrl: string
  duration: number
  fileSize: number
  channel: VideoChannel
  startTime: number
  endTime: number
}

export interface VideoDownloadRequest {
  deviceId: string
  channel: VideoChannel
  startTime: number
  endTime: number
}

export interface VideoDownloadResponse {
  downloadUrl: string
  expiresAt: number
  fileSize: number
  format: string
}

export interface VideoClip {
  clipId: string
  deviceId: string
  channel: VideoChannel
  startTime: number
  endTime: number
  duration: number
  fileSize: number
  storageUrl: string
  thumbnailUrl: string | null
  createdAt: number
}

export interface VideoClipQueryParams extends PaginationParams, TimeRangeParams {
  deviceId: string
  channel?: VideoChannel
}

/* ---------------------------------------------------------------------------
 * Webhook configuration
 * --------------------------------------------------------------------------- */

export type WebhookEventType =
  | 'device.online'
  | 'device.offline'
  | 'telematics.snapshot'
  | 'alarm.triggered'
  | 'harsh_event.detected'
  | 'rfid.swipe'
  | 'video.alarm_clip'
  | 'geofence.enter'
  | 'geofence.exit'

export interface WebhookConfig {
  webhookId: string
  url: string
  events: WebhookEventType[]
  secret: string
  isActive: boolean
  retryPolicy: WebhookRetryPolicy
  createdAt: number
  updatedAt: number
}

export interface WebhookRetryPolicy {
  maxRetries: number
  retryIntervalMs: number
  backoffMultiplier: number
}

export interface WebhookCreateParams {
  url: string
  events: WebhookEventType[]
  retryPolicy?: Partial<WebhookRetryPolicy>
}

export interface WebhookUpdateParams {
  url?: string
  events?: WebhookEventType[]
  isActive?: boolean
  retryPolicy?: Partial<WebhookRetryPolicy>
}

export interface WebhookDeliveryLog {
  deliveryId: string
  webhookId: string
  eventType: WebhookEventType
  payload: Record<string, unknown>
  statusCode: number | null
  responseBody: string | null
  attempts: number
  success: boolean
  createdAt: number
  lastAttemptAt: number
}

export interface WebhookDeliveryQueryParams extends PaginationParams {
  webhookId: string
  success?: boolean
  eventType?: WebhookEventType
}

/* ---------------------------------------------------------------------------
 * Geofence types
 * --------------------------------------------------------------------------- */

export interface GeofencePoint {
  latitude: number
  longitude: number
}

export interface Geofence {
  geofenceId: string
  name: string
  type: 'circle' | 'polygon'
  center?: GeofencePoint
  radius?: number
  points?: GeofencePoint[]
  deviceIds: string[]
  isActive: boolean
  createdAt: number
  updatedAt: number
}

/* ---------------------------------------------------------------------------
 * Batch data export
 * --------------------------------------------------------------------------- */

export type ExportFormat = 'json' | 'csv'

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ExportRequest {
  dataType: 'telematics' | 'alarms' | 'harsh_events' | 'trajectory'
  deviceIds: string[]
  timeRange: TimeRangeParams
  format: ExportFormat
}

export interface ExportTask {
  taskId: string
  status: ExportStatus
  progress: number
  downloadUrl: string | null
  expiresAt: number | null
  createdAt: number
}
