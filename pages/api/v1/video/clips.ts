/**
 * @file clips.ts
 * @brief Video clips (alarm-triggered recordings) query API - GET /api/v1/video/clips
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
  VideoClip,
  VideoClipQueryParams,
  PaginatedResult
} from '../../../../lib/api/types'

const VALID_CHANNELS = ['front', 'cabin', 'left', 'right', 'rear']

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const authReq = req as AuthenticatedRequest
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

  if (channel && !VALID_CHANNELS.includes(channel)) {
    res.status(400).json({
      code: 400,
      message: `channel must be one of: ${VALID_CHANNELS.join(', ')}`,
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  const params: VideoClipQueryParams = {
    deviceId,
    channel: channel as VideoClipQueryParams['channel'],
    startTime: parseInt(startTime, 10),
    endTime: parseInt(endTime, 10),
    page: Math.max(1, parseInt(page, 10) || 1),
    pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  }

  // TODO: Query video clips from streaming media server via HTTP API
  const result: PaginatedResult<VideoClip> = {
    items: [],
    total: 0,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: 0
  }

  sendSuccess(res, result, authReq.requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  requireVideo: true,
  rateLimit: { windowMs: 60_000, maxRequests: 30 }
})
