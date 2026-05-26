import { db } from '@/lib/db'

export async function logActivity(params: {
  userId: string
  action: string
  entityType?: string
  entityId?: string
  description?: string
  metadata?: Record<string, unknown>
}) {
  return db.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType || 'invoice',
      entityId: params.entityId || '',
      description: params.description || '',
      metadata: JSON.stringify(params.metadata || {}),
    },
  })
}
