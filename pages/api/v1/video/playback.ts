/**
 * @file playback.ts
 * @brief Video playback query API - GET /api/v1/video/playback
 * @version 1.0.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'

const VALID_CHANNELS = ['front', 'cabin', 'left', 'right', 'rear']

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
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
      requestId: (req as any).requestId
    })
    return
  }

  if (!VALID_CHANNELS.includes(channel)) {
    res.status(400).json({
      code: 400,
      message: `channel must be one of: ${VALID_CHANNELS.join(', ')}`,
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  // TODO: Query video playback from media server
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
    (req as any).requestId
  )
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 20 }
})
