/**
 * @file playback.ts
 * @brief Video playback query API - GET /api/v1/video/playback
 *        Requires Plan 3 or 4
 * @version 1.1.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import {
  AuthenticatedRequest,
  withApiMiddleware,
  sendSuccess
} from '../../../../lib/api/middleware'
import { canAccessDevice } from '../../../../lib/api/tenant'

const VALID_CHANNELS = ['front', 'cabin', 'left', 'right', 'rear']

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const authReq = req as AuthenticatedRequest
  const { deviceId, channel, startTime, endTime } = req.query as Record<
    string,
    string
  >

  if (!deviceId || !channel || !startTime || !endTime) {
    res.status(400).json({
      code: 400,
      message: 'deviceId, channel, startTime, and endTime are required',
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

  if (!VALID_CHANNELS.includes(channel)) {
    res.status(400).json({
      code: 400,
      message: `channel must be one of: ${VALID_CHANNELS.join(', ')}`,
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  // TODO: Proxy to existing streaming media server via HTTP API
  sendSuccess(
    res,
    {
      playbackUrl: '',
      duration: 0,
      fileSize: 0,
      channel,
      startTime: parseInt(startTime, 10),
      endTime: parseInt(endTime, 10)
    },
    authReq.requestId
  )
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  requireVideo: true,
  rateLimit: { windowMs: 60_000, maxRequests: 20 }
})
