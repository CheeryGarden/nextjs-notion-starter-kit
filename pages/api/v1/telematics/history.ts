/**
 * @file history.ts
 * @brief Telematics history data API - GET /api/v1/telematics/history
 * @version 1.0.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'
import { PaginatedResult, TelematicsSnapshot } from '../../../../lib/api/types'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { deviceId, startTime, endTime, page = '1', pageSize = '50' } =
    req.query as Record<string, string>

  if (!deviceId || !startTime || !endTime) {
    res.status(400).json({
      code: 400,
      message: 'deviceId, startTime, and endTime are required',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  const start = parseInt(startTime, 10)
  const end = parseInt(endTime, 10)
  if (isNaN(start) || isNaN(end) || end <= start) {
    res.status(400).json({
      code: 400,
      message: 'Invalid time range',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  const MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000
  if (end - start > MAX_RANGE_MS) {
    res.status(400).json({
      code: 400,
      message: 'Time range cannot exceed 7 days per request',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  // TODO: Query time-series database
  const result: PaginatedResult<TelematicsSnapshot> = {
    items: [],
    total: 0,
    page: Math.max(1, parseInt(page, 10) || 1),
    pageSize: Math.min(200, Math.max(1, parseInt(pageSize, 10) || 50)),
    totalPages: 0
  }

  sendSuccess(res, result, (req as any).requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 30 }
})
