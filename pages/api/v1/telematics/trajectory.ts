/**
 * @file trajectory.ts
 * @brief Device trajectory (track) query API - GET /api/v1/telematics/trajectory
 * @version 1.0.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { deviceId, startTime, endTime } = req.query as Record<string, string>

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

  const start = parseInt(startTime, 10)
  const end = parseInt(endTime, 10)
  if (isNaN(start) || isNaN(end) || end <= start) {
    res.status(400).json({
      code: 400,
      message: 'Invalid time range',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  const MAX_RANGE_MS = 24 * 60 * 60 * 1000
  if (end - start > MAX_RANGE_MS) {
    res.status(400).json({
      code: 400,
      message: 'Trajectory query range cannot exceed 24 hours',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  // TODO: Query GPS trajectory data from storage
  sendSuccess(
    res,
    {
      deviceId,
      points: [],
      totalDistance: 0,
      startTime: start,
      endTime: end
    },
    (req as any).requestId
  )
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 30 }
})
