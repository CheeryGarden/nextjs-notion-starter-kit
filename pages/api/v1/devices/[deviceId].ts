/**
 * @file [deviceId].ts
 * @brief Single device detail API - GET /api/v1/devices/:deviceId
 * @version 1.1.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { fetchDevice } from '../../../../lib/api/iot-adapter'
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
      message: 'Missing or invalid deviceId',
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

  const device = await fetchDevice(deviceId)
  if (!device) {
    res.status(404).json({
      code: 404,
      message: 'Device not found',
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  sendSuccess(res, device, authReq.requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true
})
