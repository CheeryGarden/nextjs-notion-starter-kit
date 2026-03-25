/**
 * @file snapshot.ts
 * @brief Latest telematics snapshot API - GET /api/v1/telematics/snapshot?deviceId=xxx
 * @version 1.1.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { fetchTelematicsSnapshot } from '../../../../lib/api/iot-adapter'
import {
  AuthenticatedRequest,
  withApiMiddleware,
  sendSuccess
} from '../../../../lib/api/middleware'
import { canAccessDevice } from '../../../../lib/api/tenant'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const authReq = req as AuthenticatedRequest
  const { deviceId } = req.query

  if (!deviceId || typeof deviceId !== 'string') {
    res.status(400).json({
      code: 400,
      message: 'deviceId is required',
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

  const snapshot = await fetchTelematicsSnapshot(deviceId)
  sendSuccess(res, snapshot, authReq.requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 120 }
})
