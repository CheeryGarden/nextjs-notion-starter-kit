/**
 * @file snapshot.ts
 * @brief Latest telematics snapshot API - GET /api/v1/telematics/snapshot?deviceId=xxx
 * @version 1.0.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { deviceId } = req.query

  if (!deviceId || typeof deviceId !== 'string') {
    res.status(400).json({
      code: 400,
      message: 'deviceId is required',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  // TODO: Fetch latest telematics snapshot from IoT platform / time-series DB
  sendSuccess(res, null, (req as any).requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 120 }
})
