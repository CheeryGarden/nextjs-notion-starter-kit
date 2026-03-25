/**
 * @file index.ts
 * @brief Device list API - GET /api/v1/devices
 * @version 1.1.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { fetchDevices } from '../../../../lib/api/iot-adapter'
import {
  AuthenticatedRequest,
  withApiMiddleware,
  sendSuccess
} from '../../../../lib/api/middleware'
import { DeviceListParams } from '../../../../lib/api/types'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const authReq = req as AuthenticatedRequest
  const {
    page = '1',
    pageSize = '20',
    status,
    keyword
  } = req.query as Record<string, string>

  const params: DeviceListParams = {
    page: Math.max(1, parseInt(page, 10) || 1),
    pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20)),
    status: status as DeviceListParams['status'],
    keyword
  }

  const result = await fetchDevices(params, authReq.tenant.allowedDeviceIds)
  sendSuccess(res, result, authReq.requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 60 }
})
