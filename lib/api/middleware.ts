/**
 * @file middleware.ts
 * @brief API authentication and common middleware for ofstar Connect Core Open API
 *        Supports multi-tenant isolation for 10 concurrent third-party platforms
 * @version 1.1.0
 * @date 2026-03-25
 */
import crypto from 'crypto'

import { NextApiRequest, NextApiResponse } from 'next'

import { getTenantConfig, TenantConfig } from './tenant'
import { ApiResponse } from './types'

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void

interface MiddlewareOptions {
  methods?: string[]
  requireAuth?: boolean
  requireVideo?: boolean
  rateLimit?: { windowMs: number; maxRequests: number }
}

export interface AuthenticatedRequest extends NextApiRequest {
  requestId: string
  tenant: TenantConfig
  appId: string
}

const DEFAULT_OPTIONS: MiddlewareOptions = {
  methods: ['GET'],
  requireAuth: true,
  requireVideo: false
}

/**
 * @brief Generates a unique request ID for tracing
 * @return UUID v4 string
 */
function generateRequestId(): string {
  return crypto.randomUUID()
}

/**
 * @brief Sends a standardized JSON error response
 * @param[in] res response object
 * @param[in] statusCode HTTP status code
 * @param[in] message error message
 * @param[in] requestId request tracing ID
 * @return none
 */
function sendError(
  res: NextApiResponse,
  statusCode: number,
  message: string,
  requestId: string
): void {
  const response: ApiResponse = {
    code: statusCode,
    message,
    data: null,
    timestamp: Date.now(),
    requestId
  }
  res.status(statusCode).json(response)
}

/**
 * @brief Sends a standardized JSON success response
 * @param[in] res response object
 * @param[in] data response payload
 * @param[in] requestId request tracing ID
 * @param[in] statusCode HTTP status code (default 200)
 * @return none
 */
export function sendSuccess<T>(
  res: NextApiResponse,
  data: T,
  requestId: string,
  statusCode = 200
): void {
  const response: ApiResponse<T> = {
    code: 0,
    message: 'success',
    data,
    timestamp: Date.now(),
    requestId
  }
  res.status(statusCode).json(response)
}

/**
 * @brief Validates the HMAC signature on an incoming request.
 *
 * Expected headers:
 *   X-App-Id:    the client's application ID
 *   X-Timestamp: Unix-ms timestamp (must be within +/-5 min of server time)
 *   X-Nonce:     unique nonce per request
 *   X-Signature: HMAC-SHA256( appId + timestamp + nonce + body )
 *
 * @param[in] req incoming request
 * @return appId if valid, null otherwise
 */
function validateSignature(req: NextApiRequest): string | null {
  const appId = req.headers['x-app-id'] as string
  const timestamp = req.headers['x-timestamp'] as string
  const nonce = req.headers['x-nonce'] as string
  const signature = req.headers['x-signature'] as string

  if (!appId || !timestamp || !nonce || !signature) {
    return null
  }

  const now = Date.now()
  const requestTime = parseInt(timestamp, 10)
  const FIVE_MINUTES_MS = 5 * 60 * 1000
  if (isNaN(requestTime) || Math.abs(now - requestTime) > FIVE_MINUTES_MS) {
    return null
  }

  const appSecret = lookupAppSecret(appId)
  if (!appSecret) {
    return null
  }

  const bodyStr =
    req.body && typeof req.body === 'object' ? JSON.stringify(req.body) : ''
  const payload = `${appId}${timestamp}${nonce}${bodyStr}`
  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex')

  try {
    const sigBuf = Buffer.from(signature, 'hex')
    const expectedBuf = Buffer.from(expectedSig, 'hex')
    if (sigBuf.length !== expectedBuf.length) {
      return null
    }
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null
    }
  } catch {
    return null
  }

  return appId
}

/**
 * @brief Resolves the app secret for a given appId.
 *        Production: look up from KMS, database, or secure config center.
 * @param[in] appId the application identifier
 * @return app secret or null
 */
function lookupAppSecret(appId: string): string | null {
  const secretEnvKey = `APP_SECRET_${appId.toUpperCase().replace(/-/g, '_')}`
  return process.env[secretEnvKey] ?? null
}

/* ---------------------------------------------------------------------------
 * Per-tenant rate limiting (supports 10 concurrent platforms)
 * --------------------------------------------------------------------------- */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * @brief Checks if a request is within the rate limit for its tenant
 * @param[in] key rate limit key (typically appId + endpoint)
 * @param[in] windowMs time window in milliseconds
 * @param[in] maxRequests max requests per window
 * @return true if within limit
 */
function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 60_000)

/* ---------------------------------------------------------------------------
 * Main middleware wrapper
 * --------------------------------------------------------------------------- */

/**
 * @brief Wraps an API handler with authentication, multi-tenant isolation,
 *        method validation, and rate limiting
 * @param[in] handler the API handler to wrap
 * @param[in] options middleware configuration
 * @return wrapped handler
 */
export function withApiMiddleware(
  handler: ApiHandler,
  options: MiddlewareOptions = {}
): ApiHandler {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = generateRequestId()
    res.setHeader('X-Request-Id', requestId)

    if (opts.methods && !opts.methods.includes(req.method ?? '')) {
      sendError(res, 405, 'Method not allowed', requestId)
      return
    }

    if (opts.requireAuth) {
      const appId = validateSignature(req)
      if (!appId) {
        sendError(
          res,
          401,
          'Authentication failed: invalid signature',
          requestId
        )
        return
      }

      const tenant = await getTenantConfig(appId)
      if (!tenant || !tenant.isActive) {
        sendError(res, 403, 'Tenant is inactive or not found', requestId)
        return
      }

      if (opts.requireVideo) {
        const { hasVideoAccess } = await import('./tenant')
        if (!hasVideoAccess(tenant)) {
          sendError(
            res,
            403,
            'Video features are not available for your plan',
            requestId
          )
          return
        }
      }

      if (opts.rateLimit) {
        const limitKey = `${appId}:${req.url?.split('?')[0] ?? 'unknown'}`
        if (
          !checkRateLimit(
            limitKey,
            opts.rateLimit.windowMs,
            opts.rateLimit.maxRequests
          )
        ) {
          res.setHeader(
            'Retry-After',
            String(Math.ceil(opts.rateLimit.windowMs / 1000))
          )
          sendError(res, 429, 'Rate limit exceeded', requestId)
          return
        }
      }

      const authReq = req as AuthenticatedRequest
      authReq.requestId = requestId
      authReq.tenant = tenant
      authReq.appId = appId
    } else {
      ;(req as any).requestId = requestId
    }

    try {
      await handler(req, res)
    } catch (err) {
      const safeMsg =
        err instanceof Error ? err.message : 'Unknown error'
      console.error(
        `[API Error] requestId=${requestId} error=${safeMsg}`
      )
      sendError(res, 500, 'Internal server error', requestId)
    }
  }
}
