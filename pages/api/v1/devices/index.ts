/**
 * @file index.ts
 * @brief Device list API - GET /api/v1/devices
 * @version 1.0.0
 * @date 2026-03-25
 */
import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'
import {
  Device,
  DeviceListParams,
  PaginatedResult
} from '../../../../lib/api/types'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
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

  // TODO: Replace with actual data source (database / IoT platform)
  const result: PaginatedResult<Device> = {
    items: [],
    total: 0,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: 0
  }

  sendSuccess(res, result, (req as any).requestId)
}

export default withApiMiddleware(handler, {
  methods: ['GET'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 60 }
})
