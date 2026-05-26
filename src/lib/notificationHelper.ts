/**
 * Notification helper — create in-app notifications
 */
import { db } from '@/lib/db'

export type NotificationType =
  | 'invoice_created'
  | 'invoice_sent'
  | 'invoice_paid'
  | 'overdue'
  | 'reminder'
  | 'payment_received'
  | 'system'

export async function createNotification({
  userId,
  type,
  title,
  message,
  entityId = '',
  entityType = '',
}: {
  userId: string
  type: NotificationType
  title: string
  message?: string
  entityId?: string
  entityType?: string
}) {
  try {
    return await db.notification.create({
      data: {
        userId,
        type,
        title,
        message: message || '',
        entityId,
        entityType,
      },
    })
  } catch (error) {
    // Never throw — notifications are non-critical
    console.error('[Notification] Failed to create notification:', error)
    return null
  }
}

export async function sendPushToUser(userId: string, title: string, body: string) {
  // Only run if web-push is configured
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return

  try {
    const webpush = await import('web-push')
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:noreply@sadbhawanabilldesk.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )

    const subscriptions = await db.pushSubscription.findMany({ where: { userId } })

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, icon: '/favicon-logo.png', badge: '/favicon-logo.png' })
        )
      } catch {
        // Subscription may be expired — remove it
        await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      }
    }
  } catch {
    // web-push not installed — skip silently
  }
}
