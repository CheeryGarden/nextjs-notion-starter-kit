/**
 * @file index.ts
 * @brief Alarm events query API - GET /api/v1/alarms
 * @version 1.1.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { fetchAlarms } from '../../../../lib/api/iot-adapter'
import {
  AuthenticatedRequest,
  withApiMiddleware,
  sendSuccess
} from '../../../../lib/api/middleware'
import { canAccessDevice } from '../../../../lib/api/tenant'
import { AlarmQueryParams } from '../../../../lib/api/types'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const authReq = req as AuthenticatedRequest
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
      requestId: authReq.requestId
    })
    return
  }

  if (deviceId && !canAccessDevice(authReq.tenant, deviceId)) {
    res.status(403).json({
      code: 403,
      message: 'Access denied to this device',
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  const params: AlarmQueryParams = {
    deviceId,
    type: type as AlarmQueryParams['type'],
    severity: severity as AlarmQueryParams['severity'],
    acknowledged: acknowledged === undefined ? undefined : acknowledged === 'true',
    startTime: parseInt(startTime, 10),
    endTime: parseInt(endTime, 10),
    page: Math.max(1, parseInt(page, 10) || 1),
    pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  }

  const result = await fetchAlarms(params, authReq.tenant.allowedDeviceIds)
  sendSuccess(res, result, authReq.requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 60 }
})
