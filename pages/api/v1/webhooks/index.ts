/**
 * @file index.ts
 * @brief Webhook configuration CRUD API
 *        GET  /api/v1/webhooks      - list webhooks
 *        POST /api/v1/webhooks      - create webhook
 * @version 1.0.0
 * @date 2026-03-25
 */
import crypto from 'crypto'

import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'
import { WebhookCreateParams } from '../../../../lib/api/types'

const VALID_EVENT_TYPES = [
  'device.online',
  'device.offline',
  'telematics.snapshot',
  'alarm.triggered',
  'harsh_event.detected',
  'rfid.swipe',
  'video.alarm_clip',
  'geofence.enter',
  'geofence.exit'
]

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'GET') {
    // TODO: List all webhooks for this app
    sendSuccess(res, { items: [], total: 0 }, (req as any).requestId)
    return
  }

  if (req.method === 'POST') {
    const body: WebhookCreateParams = req.body

    if (!body.url || !body.events || !Array.isArray(body.events)) {
      res.status(400).json({
        code: 400,
        message: 'url and events[] are required',
        data: null,
        timestamp: Date.now(),
        requestId: (req as any).requestId
      })
      return
    }

    try {
      const parsed = new URL(body.url)
      if (parsed.protocol !== 'https:') {
        res.status(400).json({
          code: 400,
          message: 'Webhook URL must use HTTPS',
          data: null,
          timestamp: Date.now(),
          requestId: (req as any).requestId
        })
        return
      }
    } catch {
      res.status(400).json({
        code: 400,
        message: 'Invalid webhook URL',
        data: null,
        timestamp: Date.now(),
        requestId: (req as any).requestId
      })
      return
    }

    const invalidEvents = body.events.filter(
      (e) => !VALID_EVENT_TYPES.includes(e)
    )
    if (invalidEvents.length > 0) {
      res.status(400).json({
        code: 400,
        message: `Invalid event types: ${invalidEvents.join(', ')}`,
        data: null,
        timestamp: Date.now(),
        requestId: (req as any).requestId
      })
      return
    }

    const webhookSecret = crypto.randomBytes(32).toString('hex')

    // TODO: Persist webhook configuration
    const webhook = {
      webhookId: crypto.randomUUID(),
      url: body.url,
      events: body.events,
      secret: webhookSecret,
      isActive: true,
      retryPolicy: {
        maxRetries: body.retryPolicy?.maxRetries ?? 3,
        retryIntervalMs: body.retryPolicy?.retryIntervalMs ?? 5000,
        backoffMultiplier: body.retryPolicy?.backoffMultiplier ?? 2
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    sendSuccess(res, webhook, (req as any).requestId, 201)
    return
  }
}

export default withApiMiddleware(handler, {
  methods: ['GET', 'POST'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 30 }
})
