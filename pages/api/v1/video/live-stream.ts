/**
 * @file live-stream.ts
 * @brief Live video stream request API - POST /api/v1/video/live-stream
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
import { LiveStreamRequest, LiveStreamResponse } from '../../../../lib/api/types'

const VALID_CHANNELS = ['front', 'cabin', 'left', 'right', 'rear']
const VALID_RESOLUTIONS = ['sd', 'hd']

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const authReq = req as AuthenticatedRequest
  const body: LiveStreamRequest = req.body

  if (!body.deviceId || !body.channel) {
    res.status(400).json({
      code: 400,
      message: 'deviceId and channel are required',
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  if (!canAccessDevice(authReq.tenant, body.deviceId)) {
    res.status(403).json({
      code: 403,
      message: 'Access denied to this device',
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  if (!VALID_CHANNELS.includes(body.channel)) {
    res.status(400).json({
      code: 400,
      message: `channel must be one of: ${VALID_CHANNELS.join(', ')}`,
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  if (body.resolution && !VALID_RESOLUTIONS.includes(body.resolution)) {
    res.status(400).json({
      code: 400,
      message: `resolution must be one of: ${VALID_RESOLUTIONS.join(', ')}`,
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  // TODO: Proxy to existing streaming media server via HTTP API
  const result: LiveStreamResponse = {
    streamUrl: '',
    protocol: 'hls',
    expiresAt: Date.now() + 30 * 60 * 1000,
    sessionId: ''
  }

  sendSuccess(res, result, authReq.requestId)
}

export default withApiMiddleware(handler, {
  methods: ['POST'],
  requireAuth: true,
  requireVideo: true,
  rateLimit: { windowMs: 60_000, maxRequests: 10 }
})
