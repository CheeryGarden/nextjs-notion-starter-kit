/**
 * @file [deviceId].ts
 * @brief Single device detail API - GET /api/v1/devices/:deviceId
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
      message: 'Missing or invalid deviceId',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  // TODO: Fetch device from data source
  sendSuccess(res, null, (req as any).requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true
})
