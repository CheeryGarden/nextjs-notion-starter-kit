/**
 * @file harsh-events.ts
 * @brief Harsh driving events query API - GET /api/v1/alarms/harsh-events
 * @version 1.1.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { fetchHarshEvents } from '../../../../lib/api/iot-adapter'
import {
  AuthenticatedRequest,
  withApiMiddleware,
  sendSuccess
} from '../../../../lib/api/middleware'
import { canAccessDevice } from '../../../../lib/api/tenant'
import { HarshEventQueryParams } from '../../../../lib/api/types'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const authReq = req as AuthenticatedRequest
  const {
    deviceId,
    type,
    startTime,
    endTime,
    page = '1',
    pageSize = '20'
  } = req.query as Record<string, string>

  if (!deviceId || !startTime || !endTime) {
    res.status(400).json({
      code: 400,
      message: 'deviceId, startTime, and endTime are required',
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  if (!canAccessDevice(authReq.tenant, deviceId)) {
    res.status(403).json({
      code: 403,
      message: 'Access denied to this device',
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  const params: HarshEventQueryParams = {
    deviceId,
    type: type as HarshEventQueryParams['type'],
    startTime: parseInt(startTime, 10),
    endTime: parseInt(endTime, 10),
    page: Math.max(1, parseInt(page, 10) || 1),
    pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  }

  const result = await fetchHarshEvents(params)
  sendSuccess(res, result, authReq.requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 60 }
})
