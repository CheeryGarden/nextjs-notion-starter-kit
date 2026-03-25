/**
 * @file index.ts
 * @brief Batch data export API
 *        POST /api/v1/export       - create export task
 *        GET  /api/v1/export?taskId - query export task status
 * @version 1.0.0
 * @date 2026-03-25
 */
import crypto from 'crypto'

import { NextApiRequest, NextApiResponse } from 'next'

import { withApiMiddleware, sendSuccess } from '../../../../lib/api/middleware'
import { ExportRequest, ExportTask } from '../../../../lib/api/types'

const VALID_DATA_TYPES = ['telematics', 'alarms', 'harsh_events', 'trajectory']
const VALID_FORMATS = ['json', 'csv']

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'GET') {
    const { taskId } = req.query
    if (!taskId || typeof taskId !== 'string') {
      res.status(400).json({
        code: 400,
        message: 'taskId is required',
        data: null,
        timestamp: Date.now(),
        requestId: (req as any).requestId
      })
      return
    }

    // TODO: Query export task status
    const task: ExportTask = {
      taskId: taskId,
      status: 'pending',
      progress: 0,
      downloadUrl: null,
      expiresAt: null,
      createdAt: Date.now()
    }

    sendSuccess(res, task, (req as any).requestId)
    return
  }

  if (req.method === 'POST') {
    const body: ExportRequest = req.body

    if (
      !body.dataType ||
      !body.deviceIds ||
      !body.timeRange ||
      !body.format
    ) {
      res.status(400).json({
        code: 400,
        message: 'dataType, deviceIds, timeRange, and format are required',
        data: null,
        timestamp: Date.now(),
        requestId: (req as any).requestId
      })
      return
    }

    if (!VALID_DATA_TYPES.includes(body.dataType)) {
      res.status(400).json({
        code: 400,
        message: `dataType must be one of: ${VALID_DATA_TYPES.join(', ')}`,
        data: null,
        timestamp: Date.now(),
        requestId: (req as any).requestId
      })
      return
    }

    if (!VALID_FORMATS.includes(body.format)) {
      res.status(400).json({
        code: 400,
        message: `format must be one of: ${VALID_FORMATS.join(', ')}`,
        data: null,
        timestamp: Date.now(),
        requestId: (req as any).requestId
      })
      return
    }

    if (!Array.isArray(body.deviceIds) || body.deviceIds.length === 0) {
      res.status(400).json({
        code: 400,
        message: 'deviceIds must be a non-empty array',
        data: null,
        timestamp: Date.now(),
        requestId: (req as any).requestId
      })
      return
    }

    const MAX_DEVICES_PER_EXPORT = 50
    if (body.deviceIds.length > MAX_DEVICES_PER_EXPORT) {
      res.status(400).json({
        code: 400,
        message: `Cannot export more than ${MAX_DEVICES_PER_EXPORT} devices at once`,
        data: null,
        timestamp: Date.now(),
        requestId: (req as any).requestId
      })
      return
    }

    // TODO: Create async export task (queue job)
    const task: ExportTask = {
      taskId: crypto.randomUUID(),
      status: 'pending',
      progress: 0,
      downloadUrl: null,
      expiresAt: null,
      createdAt: Date.now()
    }

    sendSuccess(res, task, (req as any).requestId, 202)
    return
  }
}

export default withApiMiddleware(handler, {
  methods: ['GET', 'POST'],
  requireAuth: true,
  rateLimit: { windowMs: 60_000, maxRequests: 5 }
})
