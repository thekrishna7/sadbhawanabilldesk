'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusCircle,
  Send,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RotateCcw,
  DollarSign,
  Pencil,
  Activity,
  ArrowRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/stores/appStore'

// ===== Types =====
interface ActivityItem {
  id: string
  action: string
  description: string
  createdAt: string
  entityType?: string
  entityId?: string
}

// ===== Activity Type Config =====
const activityTypeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  created: { icon: PlusCircle, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40' },
  sent: { icon: Send, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-100 dark:bg-sky-900/40' },
  paid: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40' },
  overdue: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/40' },
  deleted: { icon: Trash2, color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800/40' },
  recovered: { icon: RotateCcw, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/40' },
  payment_recorded: { icon: DollarSign, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/40' },
  updated: { icon: Pencil, color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800/40' },
  duplicated: { icon: PlusCircle, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40' },
}

// ===== Mock Activities =====
const mockActivities: ActivityItem[] = []

// ===== Component =====
export default function ActivityTimeline() {
  const { user, setCurrentView } = useAppStore()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const userId = user?.id || 'demo'
      const res = await fetch(`/api/activity?userId=${userId}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        if (data.activityLogs && data.activityLogs.length > 0) {
          setActivities(
            data.activityLogs.map((log: ActivityItem) => ({
              id: log.id,
              action: log.action,
              description: log.description,
              createdAt: log.createdAt,
              entityType: log.entityType,
              entityId: log.entityId,
            }))
          )
        } else {
          setActivities(mockActivities)
        }
      } else {
        setActivities(mockActivities)
      }
    } catch {
      setActivities(mockActivities)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="size-4 text-emerald-600" />
              Activity Timeline
            </CardTitle>
            <CardDescription>Recent activities</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('notifications')}
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            View All
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-14 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mb-3">
              <Activity className="size-7 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your recent activities will appear here</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-0">
                <AnimatePresence>
                  {activities.map((activity, index) => {
                    const config = activityTypeConfig[activity.action] || activityTypeConfig.updated
                    const Icon = config.icon
                    const isLast = index === activities.length - 1

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 relative pb-4"
                      >
                        {/* Icon dot */}
                        <div className={`relative z-10 flex items-center justify-center size-[30px] rounded-full shrink-0 ${config.bgColor} ring-2 ring-background`}>
                          <Icon className={`size-3.5 ${config.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm text-foreground leading-snug">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
