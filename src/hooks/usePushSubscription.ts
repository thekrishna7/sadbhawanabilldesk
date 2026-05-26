'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { urlBase64ToUint8Array } from '@/lib/pushUtils'

export function usePushSubscription(userId?: string) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)

  // Sync state with browser
  const syncSubscription = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    setPermission(Notification.permission)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('[Push] Failed to sync subscription:', error)
    }
  }, [])

  useEffect(() => {
    syncSubscription()
  }, [syncSubscription])

  const subscribe = async () => {
    if (typeof window === 'undefined') return false
    if (!('serviceWorker' in navigator)) {
      toast.error('Push notifications are not supported in this browser')
      return false
    }

    setLoading(true)
    try {
      const requestedPermission = await Notification.requestPermission()
      setPermission(requestedPermission)

      if (requestedPermission !== 'granted') {
        toast.error('Notification permission denied')
        setLoading(false)
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        toast.error('VAPID Public Key not configured')
        setLoading(false)
        return false
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      if (userId) {
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, subscription }),
        })

        if (res.ok) {
          setIsSubscribed(true)
          toast.success('Push notifications enabled!')
          setLoading(false)
          return true
        } else {
          throw new Error('Failed to save subscription on server')
        }
      }
      setLoading(false)
      return true
    } catch (error) {
      console.error('[Push] Subscription failed:', error)
      toast.error('Failed to enable push notifications')
      setIsSubscribed(false)
      setLoading(false)
      return false
    }
  }

  const unsubscribe = async () => {
    if (typeof window === 'undefined') return false
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }
      setIsSubscribed(false)
      toast.success('Push notifications disabled')
      setLoading(false)
      return true
    } catch (error) {
      console.error('[Push] Unsubscription failed:', error)
      toast.error('Error disabling push notifications')
      setLoading(false)
      return false
    }
  }

  return {
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
  }
}
