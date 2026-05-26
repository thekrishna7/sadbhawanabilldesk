'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bell,
  FileText,
  DollarSign,
  AlertCircle,
  Info,
  CheckCheck,
  ArrowLeft,
  Trash2,
  BellOff,
  BellRing,
} from 'lucide-react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

// ===== Types =====
interface Notification {
  id: string
  type: 'invoice-created' | 'payment-received' | 'invoice-overdue' | 'system-update'
  title: string
  description: string
  timestamp: Date
  read: boolean
}

// ===== Mock Data =====
const initialNotifications: Notification[] = []

// ===== Helpers =====
function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'invoice-created':
      return FileText
    case 'payment-received':
      return DollarSign
    case 'invoice-overdue':
      return AlertCircle
    case 'system-update':
      return Info
  }
}

function getNotificationColor(type: Notification['type']) {
  switch (type) {
    case 'invoice-created':
      return {
        bg: 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
        glow: 'shadow-emerald-500/30',
      }
    case 'payment-received':
      return {
        bg: 'bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/30',
        text: 'text-teal-600 dark:text-teal-400',
        badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
        glow: 'shadow-teal-500/30',
      }
    case 'invoice-overdue':
      return {
        bg: 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/30',
        text: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        glow: 'shadow-red-500/30',
      }
    case 'system-update':
      return {
        bg: 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30',
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
        glow: 'shadow-amber-500/30',
      }
  }
}

function getCategoryLabel(type: Notification['type']) {
  switch (type) {
    case 'invoice-created':
      return 'Invoice Created'
    case 'payment-received':
      return 'Payment Received'
    case 'invoice-overdue':
      return 'Invoice Overdue'
    case 'system-update':
      return 'System Update'
  }
}

// ===== Animation Variants =====
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

// ===== Component =====
export default function NotificationCenter() {
  const { setCurrentView } = useAppStore()
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [activeTab, setActiveTab] = useState('all')

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : activeTab === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.type === activeTab)

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAsUnread = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: false } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Count by category
  const categoryCounts = {
    'invoice-created': notifications.filter((n) => n.type === 'invoice-created').length,
    'payment-received': notifications.filter((n) => n.type === 'payment-received').length,
    'invoice-overdue': notifications.filter((n) => n.type === 'invoice-overdue').length,
    'system-update': notifications.filter((n) => n.type === 'system-update').length,
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 animate-fade-in"
    >
      {/* ===== Gradient Header ===== */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-sm">
          <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-0 left-1/4 size-16 rounded-full bg-white/10 blur-lg" />
          <div className="absolute top-2 right-20">
            <BellRing className="size-20 text-white/10" />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentView('dashboard')}
                className="shrink-0 text-white hover:bg-white/20"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                <p className="text-sm text-white/80">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'All caught up! No unread notifications'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:text-white rounded-xl"
                >
                  <CheckCheck className="size-4 mr-1.5" />
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== Summary Cards ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/30">
              <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Invoices</p>
              <p className="text-lg font-bold">{categoryCounts['invoice-created']}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-500 rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/30">
              <DollarSign className="size-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payments</p>
              <p className="text-lg font-bold">{categoryCounts['payment-received']}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/30">
              <AlertCircle className="size-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-lg font-bold">{categoryCounts['invoice-overdue']}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30">
              <Info className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">System</p>
              <p className="text-lg font-bold">{categoryCounts['system-update']}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Filter Tabs ===== */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="all" className="text-xs sm:text-sm rounded-lg">
              All
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs sm:text-sm rounded-lg">
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-1.5 text-[10px] px-1.5 py-0 bg-emerald-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="invoice-created" className="text-xs sm:text-sm rounded-lg">
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payment-received" className="text-xs sm:text-sm rounded-lg">
              Payments
            </TabsTrigger>
            <TabsTrigger value="invoice-overdue" className="text-xs sm:text-sm rounded-lg">
              Overdue
            </TabsTrigger>
            <TabsTrigger value="system-update" className="text-xs sm:text-sm rounded-lg">
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredNotifications.length === 0 ? (
              /* Empty State - consistent design */
              <Card className="rounded-xl shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative mb-6">
                    <div className="size-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
                      <BellOff className="size-10 text-muted-foreground/50" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {activeTab === 'unread'
                      ? "You're all caught up! There are no unread notifications."
                      : activeTab === 'all'
                        ? "You don't have any notifications yet. We'll notify you when something arrives."
                        : `No ${getCategoryLabel(activeTab as Notification['type']).toLowerCase()} notifications found.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              /* Notification List */
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[600px]">
                    <AnimatePresence>
                      {filteredNotifications.map((notification, index) => {
                        const Icon = getNotificationIcon(notification.type)
                        const colors = getNotificationColor(notification.type)
                        return (
                          <motion.div
                            key={notification.id}
                            variants={itemVariants}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, x: -20, height: 0 }}
                            className={`group relative flex items-start gap-4 px-4 sm:px-6 py-4 transition-all duration-200 cursor-pointer ${
                              !notification.read
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30'
                                : 'hover:bg-muted/50'
                            } ${index < filteredNotifications.length - 1 ? 'border-b border-border/50' : ''}`}
                          >
                            {/* Icon with gradient background */}
                            <div className={`flex items-center justify-center size-10 rounded-xl shrink-0 shadow-sm ${colors.bg}`}>
                              <Icon className={`size-5 ${colors.text}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium text-muted-foreground'}`}>
                                      {notification.title}
                                    </p>
                                    {/* Unread indicator with glow */}
                                    {!notification.read && (
                                      <div className={`size-2.5 rounded-full bg-emerald-500 shrink-0 shadow-md ${colors.glow} animate-pulse-soft`} />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                    {notification.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 rounded-md ${colors.badge}`}>
                                      {getCategoryLabel(notification.type)}
                                    </Badge>
                                    <span className="text-[11px] text-muted-foreground/70">
                                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  {notification.read ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 hover:bg-muted"
                                      onClick={() => markAsUnread(notification.id)}
                                      title="Mark as unread"
                                    >
                                      <Bell className="size-3.5" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                      onClick={() => markAsRead(notification.id)}
                                      title="Mark as read"
                                    >
                                      <CheckCheck className="size-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30"
                                    onClick={() => deleteNotification(notification.id)}
                                    title="Delete notification"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
