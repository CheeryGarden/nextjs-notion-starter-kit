/**
 * @file live-stream.ts
 * @brief Live video stream request API - POST /api/v1/video/live-stream
 * @version 1.0.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'
import { LiveStreamRequest, LiveStreamResponse } from '../../../../lib/api/types'

const VALID_CHANNELS = ['front', 'cabin', 'left', 'right', 'rear']
const VALID_RESOLUTIONS = ['sd', 'hd']

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const body: LiveStreamRequest = req.body

  if (!body.deviceId || !body.channel) {
    res.status(400).json({
      code: 400,
      message: 'deviceId and channel are required',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  if (!VALID_CHANNELS.includes(body.channel)) {
    res.status(400).json({
      code: 400,
      message: `channel must be one of: ${VALID_CHANNELS.join(', ')}`,
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  if (body.resolution && !VALID_RESOLUTIONS.includes(body.resolution)) {
    res.status(400).json({
      code: 400,
      message: `resolution must be one of: ${VALID_RESOLUTIONS.join(', ')}`,
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  // TODO: Request live stream from media server / IoT platform
  const result: LiveStreamResponse = {
    streamUrl: '',
    protocol: 'hls',
    expiresAt: Date.now() + 30 * 60 * 1000,
    sessionId: ''
  }

  sendSuccess(res, result, (req as any).requestId)
}

export default withApiMiddleware(handler, {
  methods: ['POST'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 10 }
})
