/**
 * @file download.ts
 * @brief Video download request API - POST /api/v1/video/download
 * @version 1.0.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'
import {
  VideoDownloadRequest,
  VideoDownloadResponse
} from '../../../../lib/api/types'

const VALID_CHANNELS = ['front', 'cabin', 'left', 'right', 'rear']

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const body: VideoDownloadRequest = req.body

  if (!body.deviceId || !body.channel || !body.startTime || !body.endTime) {
    res.status(400).json({
      code: 400,
      message: 'deviceId, channel, startTime, and endTime are required',
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

  const MAX_DOWNLOAD_DURATION_MS = 60 * 60 * 1000
  if (body.endTime - body.startTime > MAX_DOWNLOAD_DURATION_MS) {
    res.status(400).json({
      code: 400,
      message: 'Download duration cannot exceed 1 hour per request',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  // TODO: Generate pre-signed download URL from media storage
  const result: VideoDownloadResponse = {
    downloadUrl: '',
    expiresAt: Date.now() + 30 * 60 * 1000,
    fileSize: 0,
    format: 'mp4'
  }

  sendSuccess(res, result, (req as any).requestId)
}

export default withApiMiddleware(handler, {
  methods: ['POST'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 5 }
})
