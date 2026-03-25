/**
 * @file deliveries.ts
 * @brief Webhook delivery log query API - GET /api/v1/webhooks/deliveries
 * @version 1.0.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'
import {
  WebhookDeliveryLog,
  WebhookDeliveryQueryParams,
  PaginatedResult
} from '../../../../lib/api/types'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const {
    webhookId,
    success,
    eventType,
    page = '1',
    pageSize = '20'
  } = req.query as Record<string, string>

  if (!webhookId) {
    res.status(400).json({
      code: 400,
      message: 'webhookId is required',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  const _params: WebhookDeliveryQueryParams = {
    webhookId,
    success: success === undefined ? undefined : success === 'true',
    eventType: eventType as WebhookDeliveryQueryParams['eventType'],
    page: Math.max(1, parseInt(page, 10) || 1),
    pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  }

  // TODO: Query delivery logs from storage
  const result: PaginatedResult<WebhookDeliveryLog> = {
    items: [],
    total: 0,
    page: _params.page,
    pageSize: _params.pageSize,
    totalPages: 0
  }

  sendSuccess(res, result, (req as any).requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 30 }
})
