/**
 * @file index.ts
 * @brief Alarm events query API - GET /api/v1/alarms
 * @version 1.0.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'
import {
  AlarmEvent,
  AlarmQueryParams,
  PaginatedResult
} from '../../../../lib/api/types'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const {
    deviceId,
    type,
    severity,
    acknowledged,
    startTime,
    endTime,
    page = '1',
    pageSize = '20'
  } = req.query as Record<string, string>

  if (!startTime || !endTime) {
    res.status(400).json({
      code: 400,
      message: 'startTime and endTime are required',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  const _params: AlarmQueryParams = {
    deviceId,
    type: type as AlarmQueryParams['type'],
    severity: severity as AlarmQueryParams['severity'],
    acknowledged: acknowledged === undefined ? undefined : acknowledged === 'true',
    startTime: parseInt(startTime, 10),
    endTime: parseInt(endTime, 10),
    page: Math.max(1, parseInt(page, 10) || 1),
    pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  }

  // TODO: Query alarm events from storage
  const result: PaginatedResult<AlarmEvent> = {
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
  rateLimit: { windowMs: 60_000, maxRequests: 60 }
})
