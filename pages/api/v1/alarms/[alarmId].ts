/**
 * @file [alarmId].ts
 * @brief Single alarm detail / acknowledge API
 *        GET  /api/v1/alarms/:alarmId
 *        PUT  /api/v1/alarms/:alarmId  (acknowledge)
 * @version 1.1.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { fetchAlarm } from '../../../../lib/api/iot-adapter'
import {
  AuthenticatedRequest,
  withApiMiddleware,
  sendSuccess
} from '../../../../lib/api/middleware'
import { canAccessDevice } from '../../../../lib/api/tenant'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const authReq = req as AuthenticatedRequest
  const { alarmId } = req.query

  if (!alarmId || typeof alarmId !== 'string') {
    res.status(400).json({
      code: 400,
      message: 'Missing or invalid alarmId',
      data: null,
      timestamp: Date.now(),
      requestId: authReq.requestId
    })
    return
  }

  if (req.method === 'GET') {
    const alarm = await fetchAlarm(alarmId)
    if (!alarm) {
      res.status(404).json({
        code: 404,
        message: 'Alarm not found',
        data: null,
        timestamp: Date.now(),
        requestId: authReq.requestId
      })
      return
    }

    if (!canAccessDevice(authReq.tenant, alarm.deviceId)) {
      res.status(403).json({
        code: 403,
        message: 'Access denied to this alarm',
        data: null,
        timestamp: Date.now(),
        requestId: authReq.requestId
      })
      return
    }

    sendSuccess(res, alarm, authReq.requestId)
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
        requestId: authReq.requestId
      })
      return
    }
    // TODO: Update alarm acknowledged status via IoT platform HTTP API
    sendSuccess(res, { alarmId, acknowledged }, authReq.requestId)
    return
  }
}

export default withApiMiddleware(handler, {
  methods: ['GET', 'PUT'],
  requireAuth: true
})
