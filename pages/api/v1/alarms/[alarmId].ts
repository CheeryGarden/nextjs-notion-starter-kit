/**
 * @file [alarmId].ts
 * @brief Single alarm detail / acknowledge API
 *        GET  /api/v1/alarms/:alarmId
 *        PUT  /api/v1/alarms/:alarmId  (acknowledge)
 * @version 1.0.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { alarmId } = req.query

  if (!alarmId || typeof alarmId !== 'string') {
    res.status(400).json({
      code: 400,
      message: 'Missing or invalid alarmId',
      data: null,
      timestamp: Date.now(),
      requestId: (req as any).requestId
    })
    return
  }

  if (req.method === 'GET') {
    // TODO: Fetch alarm detail
    sendSuccess(res, null, (req as any).requestId)
    return
  }

  if (req.method === 'PUT') {
    const { acknowledged } = req.body || {}
    if (typeof acknowledged !== 'boolean') {
      res.status(400).json({
        code: 400,
        message: 'acknowledged (boolean) is required in request body',
        data: null,
        timestamp: Date.now(),
        requestId: (req as any).requestId
      })
      return
    }
    // TODO: Update alarm acknowledged status
    sendSuccess(res, { alarmId, acknowledged }, (req as any).requestId)
    return
  }
}

export default withApiMiddleware(handler, {
  methods: ['GET', 'PUT'],
  requireAuth: true
})
