/**
 * @file clips.ts
 * @brief Video clips (alarm-triggered recordings) query API - GET /api/v1/video/clips
 * @version 1.0.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'
import {
  VideoClip,
  VideoClipQueryParams,
  PaginatedResult
} from '../../../../lib/api/types'

const VALID_CHANNELS = ['front', 'cabin', 'left', 'right', 'rear']

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const {
    deviceId,
    channel,
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
      requestId: (req as any).requestId
    })
    return
  }

  if (channel && !VALID_CHANNELS.includes(channel)) {
    res.status(400).json({
      code: 400,
      message: `channel must be one of: ${VALID_CHANNELS.join(', ')}`,
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  const _params: VideoClipQueryParams = {
    deviceId,
    channel: channel as VideoClipQueryParams['channel'],
    startTime: parseInt(startTime, 10),
    endTime: parseInt(endTime, 10),
    page: Math.max(1, parseInt(page, 10) || 1),
    pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  }

  // TODO: Query video clips from storage
  const result: PaginatedResult<VideoClip> = {
    items: [],
    total: 0,
    page: _params.page,
    pageSize: _params.pageSize,
    totalPages: 0
  }

  sendSuccess(res, result, (req as any).requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 30 }
})
