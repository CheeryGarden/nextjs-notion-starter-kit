/**
 * @file middleware.ts
 * @brief API authentication and common middleware for ofstar Connect Core Open API
 * @version 1.0.0
 * @date 2026-03-25
 */
import crypto from 'crypto'

import { NextApiRequest, NextApiResponse } from 'next'

import { ApiResponse } from './types'

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void

interface MiddlewareOptions {
  methods?: string[]
  requireAuth?: boolean
  rateLimit?: { windowMs: number; maxRequests: number }
}

const DEFAULT_OPTIONS: MiddlewareOptions = {
  methods: ['GET'],
  requireAuth: true
}

/**
 * Generates a unique request ID for tracing
 */
function generateRequestId(): string {
  return crypto.randomUUID()
}

/**
 * Sends a standardized JSON error response
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
 * Sends a standardized JSON success response
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
 * Validates the HMAC signature on an incoming request.
 *
 * Expected headers:
 *   X-App-Id:    the client's application ID
 *   X-Timestamp: Unix-ms timestamp (must be within ±5 min of server time)
 *   X-Nonce:     unique nonce per request
 *   X-Signature: HMAC-SHA256( appId + timestamp + nonce + body )
 */
function validateSignature(req: NextApiRequest): boolean {
  const appId = req.headers['x-app-id'] as string
  const timestamp = req.headers['x-timestamp'] as string
  const nonce = req.headers['x-nonce'] as string
  const signature = req.headers['x-signature'] as string

  if (!appId || !timestamp || !nonce || !signature) {
    return false
  }

  const now = Date.now()
  const requestTime = parseInt(timestamp, 10)
  const FIVE_MINUTES_MS = 5 * 60 * 1000
  if (isNaN(requestTime) || Math.abs(now - requestTime) > FIVE_MINUTES_MS) {
    return false
  }

  const appSecret = lookupAppSecret(appId)
  if (!appSecret) {
    return false
  }

  const bodyStr =
    req.body && typeof req.body === 'object' ? JSON.stringify(req.body) : ''
  const payload = `${appId}${timestamp}${nonce}${bodyStr}`
  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSig, 'hex')
  )
}

/**
 * Resolves the app secret for a given appId.
 * Production: look up from KMS, database, or secure config center.
 */
function lookupAppSecret(appId: string): string | null {
  const secrets: Record<string, string | undefined> = {
    [process.env.OFSTAR_APP_ID ?? '']: process.env.OFSTAR_APP_SECRET
  }
  return secrets[appId] ?? null
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

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

/**
 * Wraps an API handler with authentication, method validation, and rate limiting
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

    if (opts.requireAuth && !validateSignature(req)) {
      sendError(res, 401, 'Authentication failed: invalid signature', requestId)
      return
    }

    if (opts.rateLimit) {
      const clientKey =
        (req.headers['x-app-id'] as string) ||
        req.socket.remoteAddress ||
        'anonymous'
      if (
        !checkRateLimit(clientKey, opts.rateLimit.windowMs, opts.rateLimit.maxRequests)
      ) {
        sendError(res, 429, 'Rate limit exceeded', requestId)
        return
      }
    }

    ;(req as any).requestId = requestId

    try {
      await handler(req, res)
    } catch (err) {
      console.error(`[API Error] requestId=${requestId}`, err)
      sendError(res, 500, 'Internal server error', requestId)
    }
  }
}
