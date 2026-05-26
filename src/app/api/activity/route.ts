import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List recent activity logs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const limitParam = searchParams.get('limit')
    const entityType = searchParams.get('entityType')
    const action = searchParams.get('action')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 1), 100)

    // Build where clause
    const where: Record<string, unknown> = { userId }

    if (entityType) {
      where.entityType = entityType
    }

    if (action) {
      where.action = action
    }

    const activityLogs = await db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Parse metadata JSON strings for convenience
    const parsedLogs = activityLogs.map((log) => ({
      ...log,
      metadata: JSON.parse(log.metadata || '{}'),
    }))

    // Get total count for pagination info
    const totalCount = await db.activityLog.count({ where })

    return NextResponse.json({
      activityLogs: parsedLogs,
      total: totalCount,
      limit,
    })
  } catch (error) {
    console.error('Activity log list error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
  }
}
