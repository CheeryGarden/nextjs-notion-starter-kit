/**
 * @file download.ts
 * @brief Video download request API - POST /api/v1/video/download
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
import {
  VideoDownloadRequest,
  VideoDownloadResponse
} from '../../../../lib/api/types'

const VALID_CHANNELS = ['front', 'cabin', 'left', 'right', 'rear']

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const authReq = req as AuthenticatedRequest
  const body: VideoDownloadRequest = req.body

  if (!body.deviceId || !body.channel || !body.startTime || !body.endTime) {
    res.status(400).json({
      code: 400,
      message: 'deviceId, channel, startTime, and endTime are required',
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

  const MAX_DOWNLOAD_DURATION_MS = 60 * 60 * 1000
  if (body.endTime - body.startTime > MAX_DOWNLOAD_DURATION_MS) {
    res.status(400).json({
      code: 400,
      message: 'Download duration cannot exceed 1 hour per request',
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  // TODO: Request pre-signed download URL from streaming media server
  const result: VideoDownloadResponse = {
    downloadUrl: '',
    expiresAt: Date.now() + 30 * 60 * 1000,
    fileSize: 0,
    format: 'mp4'
  }

  sendSuccess(res, result, authReq.requestId)
}

export default withApiMiddleware(handler, {
  methods: ['POST'],
  requireAuth: true,
  requireVideo: true,
  rateLimit: { windowMs: 60_000, maxRequests: 5 }
})
