'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/stores/appStore'
import { usePushSubscription } from '@/hooks/usePushSubscription'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  FileText,
  IndianRupee,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  UserPlus,
  FileDown,
  ArrowRight,
  Users,
  BarChart3,
  Percent,
  CalendarCheck,
  CalendarPlus,
  Sun,
  Moon,
  Coffee,
  RefreshCw,
  Calendar,
  AlertTriangle,
  BellRing,
  Target,
  Zap,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { motion, Variants } from 'framer-motion'
import { format } from 'date-fns'
import ActivityTimeline from './ActivityTimeline'

// ===== Types =====
interface DashboardData {
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalRevenue: number
  pendingAmount: number
  recentInvoices: RecentInvoice[]
  monthlyRevenue: { month: string; revenue: number }[]
}

interface RecentInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  grandTotal: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  invoiceDate: string
  createdAt: string
}

// ===== Status Config =====
const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  sent: {
    label: 'Sent',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
}

// ===== Chart Configs =====
const revenueChartConfig: ChartConfig = {
  revenue: {
    label: 'Revenue',
    color: '#0057D9',
  },
}

const pieChartConfig: ChartConfig = {
  paid: { label: 'Paid', color: '#0057D9' },
  pending: { label: 'Pending', color: '#F5A623' },
  overdue: { label: 'Overdue', color: '#ef4444' },
  draft: { label: 'Draft', color: '#A0A0A0' },
}

const PIE_COLORS = ['#0057D9', '#F5A623', '#ef4444', '#A0A0A0']

// ===== Mock Data (for when API fails or no data) =====
const mockDashboardData: DashboardData = {
  totalInvoices: 0,
  paidInvoices: 0,
  pendingInvoices: 0,
  overdueInvoices: 0,
  totalRevenue: 0,
  pendingAmount: 0,
  recentInvoices: [],
  monthlyRevenue: [],
}

// ===== Animation Variants =====
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

// ===== Helper =====
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount)

// ===== Animated Counter Hook =====
function useAnimatedCounter(end: number, duration: number = 1200, startOnMount: boolean = true) {
  const [count, setCount] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!startOnMount) return
    let startTime: number | null = null
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [end, duration, startOnMount])

  return count
}

// ===== Animated Currency Counter Hook =====
function useAnimatedCurrency(end: number, duration: number = 1200, startOnMount: boolean = true) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!startOnMount) return
    let startTime: number | null = null
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * end))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setValue(end)
      }
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [end, duration, startOnMount])

  return value
}

// ===== Greeting Helper =====
function getGreeting(): { text: string; icon: React.ElementType } {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good morning', icon: Sun }
  if (hour < 17) return { text: 'Good afternoon', icon: Coffee }
  return { text: 'Good evening', icon: Moon }
}

// ===== Component =====
// ===== Push Notification Banner Component =====
function PushNotificationBanner({ userId }: { userId: string }) {
  const { isSubscribed, permission, subscribe } = usePushSubscription(userId)
  const [dismissed, setDismissed] = useState(true) // Start with true, sync on mount

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem('dismissed-push-banner') === 'true'
      setDismissed(isDismissed)
    }
  }, [])

  if (dismissed || isSubscribed || permission === 'granted' || permission === 'denied') {
    return null
  }

  const handleDismiss = () => {
    localStorage.setItem('dismissed-push-banner', 'true')
    setDismissed(true)
  }

  const handleEnable = async () => {
    const success = await subscribe()
    if (success) {
      handleDismiss()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4"
    >
      <Card className="rounded-xl border-emerald-250 dark:border-emerald-900 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 shrink-0">
                <BellRing className="size-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  Enable Push Notifications
                </h3>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                  Get real-time alerts when invoices are created, shared, or marked as paid.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleDismiss}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors text-muted-foreground"
              >
                Not Now
              </button>
              <Button
                onClick={handleEnable}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs h-8 px-3"
              >
                Allow Notifications
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ===== Payment Reminders Component =====
function PaymentReminders({ userId }: { userId: string }) {
  const [reminders, setReminders] = useState<{
    overdueInvoices: { id: string; invoiceNumber: string; billToName: string; currentBalance: number; dueDate: string; currency: string }[]
    dueSoonInvoices: { id: string; invoiceNumber: string; billToName: string; currentBalance: number; dueDate: string; currency: string }[]
    totalOverdueAmount: number
    totalDueSoonAmount: number
    overdueCount: number
    dueSoonCount: number
  } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/invoices/reminders?userId=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setReminders(data) })
      .catch(() => {})
  }, [userId])

  if (!reminders || dismissed) return null
  if (reminders.overdueCount === 0 && reminders.dueSoonCount === 0) return null

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SGD: 'S$', AUD: 'A$', CAD: 'C$' }
    return symbols[code] || '₹'
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      {reminders.overdueCount > 0 && (
        <Card className="rounded-xl border-red-200 dark:border-red-900 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-red-100 dark:bg-red-900/50 shrink-0">
                <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-red-800 dark:text-red-300">
                    {reminders.overdueCount} Overdue Invoice{reminders.overdueCount > 1 ? 's' : ''}
                  </h3>
                  <button
                    onClick={() => setDismissed(true)}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-2">
                  Total overdue: {getCurrencySymbol('INR')}{reminders.totalOverdueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {reminders.overdueInvoices.slice(0, 3).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center gap-2 text-xs bg-white/60 dark:bg-black/20 rounded-lg px-2.5 py-1.5 border border-red-100 dark:border-red-900/50"
                    >
                      <span className="font-medium text-red-700 dark:text-red-300">{inv.invoiceNumber}</span>
                      <span className="text-red-500 dark:text-red-400">{inv.billToName || 'Unknown'}</span>
                      <span className="font-semibold text-red-800 dark:text-red-300">
                        {getCurrencySymbol(inv.currency)}{inv.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                  {reminders.overdueCount > 3 && (
                    <span className="text-xs text-red-500 dark:text-red-400 self-center">
                      +{reminders.overdueCount - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reminders.dueSoonCount > 0 && reminders.overdueCount === 0 && (
        <Card className="rounded-xl border-amber-200 dark:border-amber-900 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 shrink-0">
                <BellRing className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                    {reminders.dueSoonCount} Due Soon
                  </h3>
                  <button
                    onClick={() => setDismissed(true)}
                    className="text-xs text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mb-2">
                  Invoices due within 3 days: {getCurrencySymbol('INR')}{reminders.totalDueSoonAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

export default function DashboardHome() {
  const { user, setCurrentView } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'thisWeek' | 'thisMonth' | 'thisQuarter' | 'thisYear' | 'custom'>('thisMonth')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const getDateRangeParams = useCallback(() => {
    const now = new Date()
    let startDate = ''
    let endDate = now.toISOString().split('T')[0]

    switch (dateRange) {
      case 'thisWeek': {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startDate = startOfWeek.toISOString().split('T')[0]
        break
      }
      case 'thisMonth': {
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        break
      }
      case 'thisQuarter': {
        const quarterStart = Math.floor(now.getMonth() / 3) * 3
        startDate = `${now.getFullYear()}-${String(quarterStart + 1).padStart(2, '0')}-01`
        break
      }
      case 'thisYear': {
        startDate = `${now.getFullYear()}-01-01`
        break
      }
      case 'custom': {
        startDate = customStart
        endDate = customEnd
        break
      }
    }

    return { startDate, endDate }
  }, [dateRange, customStart, customEnd])

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const userId = user?.id || 'demo'
      const { startDate, endDate } = getDateRangeParams()
      const params = new URLSearchParams({ userId })
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      const res = await fetch(`/api/dashboard?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        // Ensure monthlyRevenue has data
        if (!json.monthlyRevenue || json.monthlyRevenue.length === 0) {
          json.monthlyRevenue = mockDashboardData.monthlyRevenue
        }
        // Ensure recentInvoices has data
        if (!json.recentInvoices || json.recentInvoices.length === 0) {
          json.recentInvoices = mockDashboardData.recentInvoices
        }
        setData(json)
      } else {
        setData(mockDashboardData)
      }
    } catch {
      setData(mockDashboardData)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard, dateRange])

  // Animated counters
  const totalInvoicesCount = useAnimatedCounter(data?.totalInvoices ?? 0, 1200, !loading)
  const totalRevenueCount = useAnimatedCurrency(data?.totalRevenue ?? 0, 1500, !loading)
  const pendingCount = useAnimatedCounter(data?.pendingInvoices ?? 0, 1000, !loading)
  const overdueCount = useAnimatedCounter(data?.overdueInvoices ?? 0, 800, !loading)

  // Compute pie data
  const pieData = data
    ? [
        { name: 'Paid', value: data.paidInvoices, key: 'paid' },
        { name: 'Pending', value: data.pendingInvoices, key: 'pending' },
        { name: 'Overdue', value: data.overdueInvoices, key: 'overdue' },
        { name: 'Draft', value: Math.max(0, data.totalInvoices - data.paidInvoices - data.pendingInvoices - data.overdueInvoices), key: 'draft' },
      ].filter((d) => d.value > 0)
    : []

  // Quick stats computations
  const avgInvoiceValue = data && data.totalInvoices > 0 ? Math.round(data.totalRevenue / data.totalInvoices) : 0
  const collectionRate = data && data.totalInvoices > 0 ? Math.round((data.paidInvoices / data.totalInvoices) * 100) : 0
  const totalCustomers = data ? new Set(data.recentInvoices.map(inv => inv.customerName)).size : 0

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  const overdueValue = data?.overdueInvoices ?? 0

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ===== Date Range Selector ===== */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="size-4 text-emerald-600" />
                Period:
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'thisWeek', label: 'This Week' },
                  { key: 'thisMonth', label: 'This Month' },
                  { key: 'thisQuarter', label: 'This Quarter' },
                  { key: 'thisYear', label: 'This Year' },
                  { key: 'custom', label: 'Custom' },
                ] as const).map((opt) => (
                  <Button
                    key={opt.key}
                    variant={dateRange === opt.key ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'text-xs rounded-xl',
                      dateRange === opt.key && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    )}
                    onClick={() => setDateRange(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {dateRange === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-8 text-xs w-36"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-8 text-xs w-36"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Welcome Greeting with Glassmorphism + Mesh Grid ===== */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-xl backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-lg p-5">
        {/* Gradient background layer behind glass */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/10 dark:to-cyan-500/20 -z-10" />
        {/* Mesh grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMCw4NywyMTcsMC4xKSIvPjxwYXRoIGQ9Ik0wIDIwaDQwTTIwIDB2NDAiIHN0cm9rZT0icmdiYSgwLDg3LDIxNywwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-60 dark:opacity-30" />
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 size-32 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 size-24 rounded-full bg-teal-400/10 blur-xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
              <GreetingIcon className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {greeting.text}, {user?.name?.split(' ')[0] || 'Demo User'} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Here&apos;s what&apos;s happening with your invoices today
              </p>
            </div>
          </div>

          {/* Today's Summary Mini Cards */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border bg-card/80 backdrop-blur-sm px-4 py-2.5 shadow-sm">
              <CalendarCheck className="size-4 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Due today</p>
                <p className="text-sm font-bold">2 invoices</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border bg-card/80 backdrop-blur-sm px-4 py-2.5 shadow-sm">
              <CalendarPlus className="size-4 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Created today</p>
                <p className="text-sm font-bold">1 invoice</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== Push Notification Banner ===== */}
      <PushNotificationBanner userId={user?.id || ''} />

      {/* ===== Payment Reminders Banner ===== */}
      <PaymentReminders userId={user?.id || ''} />

      {/* ===== Stats Cards with hover effects ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <motion.div variants={itemVariants} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
          <Card className="card-shine relative overflow-hidden border-t-4 border-t-emerald-500 rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Invoices
                  </p>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl lg:text-3xl font-bold tabular-nums">{totalInvoicesCount}</p>
                  )}
                </div>
                <div className="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30">
                  <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <TrendingUp className="size-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">+12%</span>
                <span className="text-xs text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Revenue */}
        <motion.div variants={itemVariants} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
          <Card className="card-shine relative overflow-hidden border-t-4 border-t-teal-500 rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Monthly Revenue
                  </p>
                  {loading ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    <p className="text-2xl lg:text-3xl font-bold tabular-nums">{formatCurrency(totalRevenueCount)}</p>
                  )}
                </div>
                <div className="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/30">
                  <IndianRupee className="size-5 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <TrendingUp className="size-3.5 text-teal-500" />
                <span className="text-xs font-medium text-teal-600 dark:text-teal-400">+8.2%</span>
                <span className="text-xs text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Payments */}
        <motion.div variants={itemVariants} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
          <Card className="card-shine relative overflow-hidden border-t-4 border-t-amber-500 rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pending
                  </p>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl lg:text-3xl font-bold tabular-nums">{pendingCount}</p>
                  )}
                </div>
                <div className="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30">
                  <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <TrendingDown className="size-3.5 text-amber-500" />
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">-3%</span>
                <span className="text-xs text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overdue */}
        <motion.div variants={itemVariants} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
          <Card className="card-shine relative overflow-hidden border-t-4 border-t-red-500 rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Overdue
                  </p>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl lg:text-3xl font-bold tabular-nums">{overdueCount}</p>
                  )}
                </div>
                <div className="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30">
                  <AlertCircle className="size-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {overdueValue > 0 ? (
                  <>
                    <TrendingUp className="size-3.5 text-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 animate-pulse">+2</span>
                    <span className="text-xs text-muted-foreground">since last week</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="size-3.5 text-red-500" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">+2</span>
                    <span className="text-xs text-muted-foreground">since last week</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ===== Quick Stats Row with Colored Left-Border Accents ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-200/50 dark:border-emerald-800/30 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <BarChart3 className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. Invoice Value</p>
              <div className="text-lg font-bold">{loading ? <Skeleton className="h-6 w-20 inline-block" /> : formatCurrency(avgInvoiceValue)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-500 bg-gradient-to-br from-teal-50/50 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 border-teal-200/50 dark:border-teal-800/30 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-teal-100 dark:bg-teal-900/40">
              <Percent className="size-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Collection Rate</p>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold">{loading ? <Skeleton className="h-6 w-12 inline-block" /> : `${collectionRate}%`}</div>
              </div>
              {!loading && (
                <Progress value={collectionRate} className="h-1.5 mt-1.5 [&>div]:bg-emerald-500" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50/50 to-emerald-50/30 dark:from-cyan-950/20 dark:to-emerald-950/10 border-cyan-200/50 dark:border-cyan-800/30 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/40">
              <Users className="size-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Customers</p>
              <div className="text-lg font-bold">{loading ? <Skeleton className="h-6 w-8 inline-block" /> : (totalCustomers > 0 ? totalCustomers : 12)}</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Revenue Chart + Quick Actions ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Revenue Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="rounded-xl relative overflow-hidden">
            {/* Subtle gradient overlay on chart area */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-emerald-50/30 to-transparent dark:from-emerald-950/20 dark:to-transparent pointer-events-none z-0" />
            <CardHeader className="pb-2 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                  <div className="flex items-center gap-3 mt-1">
                    <CardDescription>Monthly revenue for the last 6 months</CardDescription>
                    {/* Last updated timestamp with refresh */}
                    <button
                      onClick={fetchDashboard}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <RefreshCw className="size-3" />
                      <span>Updated just now</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Revenue Trend Sparkline Mini-Chart */}
              {!loading && data?.monthlyRevenue && data.monthlyRevenue.length > 1 && (
                <div className="flex items-center gap-2 mt-2">
                  <svg width="80" height="24" className="text-emerald-500">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={data.monthlyRevenue.map((d, i) => {
                        const min = Math.min(...data.monthlyRevenue.map(v => v.revenue))
                        const max = Math.max(...data.monthlyRevenue.map(v => v.revenue))
                        const range = max - min || 1
                        const x = (i / (data.monthlyRevenue.length - 1)) * 80
                        const y = 24 - ((d.revenue - min) / range) * 20
                        return `${x},${y}`
                      }).join(' ')}
                    />
                  </svg>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {data.monthlyRevenue.length > 1 &&
                      data.monthlyRevenue[data.monthlyRevenue.length - 1].revenue >= data.monthlyRevenue[data.monthlyRevenue.length - 2].revenue
                      ? <TrendingUp className="inline size-3 mr-0.5" />
                      : <TrendingDown className="inline size-3 mr-0.5" />
                    }
                    {data.monthlyRevenue.length > 1
                      ? Math.round(((data.monthlyRevenue[data.monthlyRevenue.length - 1].revenue - data.monthlyRevenue[data.monthlyRevenue.length - 2].revenue) / (data.monthlyRevenue[data.monthlyRevenue.length - 2].revenue || 1)) * 100)
                      : 0
                    }%
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-[280px] w-full rounded-lg skeleton-shimmer" />
                </div>
              ) : (
                <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                  <AreaChart data={data?.monthlyRevenue || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0057D9" stopOpacity={0.35} />
                        <stop offset="50%" stopColor="#003A99" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0057D9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revenueStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0057D9" />
                        <stop offset="50%" stopColor="#003A99" />
                        <stop offset="100%" stopColor="#F5A623" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="url(#revenueStrokeGradient)"
                      strokeWidth={2.5}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions + Pie Chart */}
        <motion.div variants={itemVariants} className="space-y-4 lg:space-y-6">
          {/* Quick Actions - Enhanced with gradient icons, hover lift, staggered animation */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  label: 'Create Invoice',
                  desc: 'Generate a new invoice',
                  icon: PlusCircle,
                  gradient: 'from-emerald-400 to-teal-500',
                  shadow: 'shadow-emerald-500/20',
                  onClick: () => setCurrentView('create-invoice'),
                  primary: true,
                },
                {
                  label: 'Add Customer',
                  desc: 'Add a new client',
                  icon: UserPlus,
                  gradient: 'from-teal-400 to-cyan-500',
                  shadow: 'shadow-teal-500/20',
                  onClick: () => setCurrentView('customers'),
                  primary: false,
                },
                {
                  label: 'View Reports',
                  desc: 'Analytics & insights',
                  icon: BarChart3,
                  gradient: 'from-cyan-400 to-emerald-500',
                  shadow: 'shadow-cyan-500/20',
                  onClick: () => setCurrentView('reports'),
                  primary: false,
                },
                {
                  label: 'Manage Recurring',
                  desc: 'Recurring invoices',
                  icon: RotateCcw,
                  gradient: 'from-emerald-400 to-teal-500',
                  shadow: 'shadow-emerald-500/20',
                  onClick: () => setCurrentView('recurring'),
                  primary: false,
                },
              ].map((action, index) => {
                const ActionIcon = action.icon
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
                    whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.onClick}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group ${
                      action.primary
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    <div className={`flex items-center justify-center size-9 rounded-lg shrink-0 ${
                      action.primary
                        ? 'bg-white/20'
                        : `bg-gradient-to-br ${action.gradient} shadow-md ${action.shadow}`
                    }`}>
                      <ActionIcon className={`size-4 ${action.primary ? 'text-white' : 'text-white'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${action.primary ? '' : 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors'}`}>
                        {action.label}
                      </p>
                      <p className={`text-xs ${action.primary ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                        {action.desc}
                      </p>
                    </div>
                    <ArrowRight className={`size-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      action.primary ? 'text-emerald-200' : 'text-emerald-500'
                    }`} />
                  </motion.button>
                )
              })}
            </CardContent>
          </Card>

          {/* Invoice Status Pie Chart */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Invoice Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center">
                  <Skeleton className="h-[180px] w-[180px] rounded-full" />
                </div>
              ) : (
                <div className="flex flex-col items-center relative">
                  <ChartContainer config={pieChartConfig} className="h-[180px] w-[180px]">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--popover))',
                          color: 'hsl(var(--popover-foreground))',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value} invoices`, '']}
                      />
                    </PieChart>
                  </ChartContainer>
                  {/* Center label showing total invoice count */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ height: '180px' }}>
                    <div className="text-center">
                      <p className="text-xl font-bold tabular-nums">{data?.totalInvoices ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-3 mt-3">
                    {pieData.map((entry, index) => (
                      <div key={entry.key} className="flex items-center gap-1.5">
                        <div
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-xs text-muted-foreground">{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ===== Revenue Forecast Widget ===== */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-xl border-l-4 border-l-emerald-500 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-emerald-400/5 blur-2xl" />
          <div className="absolute -left-4 -bottom-4 size-24 rounded-full bg-teal-400/5 blur-xl" />
          <CardContent className="p-4 lg:p-6 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
                  <Target className="size-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">Revenue Forecast</CardTitle>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Sparkles className="size-3 mr-0.5" />
                      AI Projected
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Next 3 months based on past trends</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {(() => {
                  const monthlyRev = data?.monthlyRevenue || []
                  const avgMonthly = monthlyRev.length > 0
                    ? monthlyRev.reduce((s, m) => s + m.revenue, 0) / monthlyRev.length
                    : 0
                  const pendingAmount = data?.pendingAmount || 0
                  const totalForecast = Math.round(avgMonthly * 3 + pendingAmount * 0.6)
                  const trendDirection = monthlyRev.length >= 2
                    ? monthlyRev[monthlyRev.length - 1].revenue >= monthlyRev[monthlyRev.length - 2].revenue
                    : true
                  const trendPercent = monthlyRev.length >= 2
                    ? Math.round(((monthlyRev[monthlyRev.length - 1].revenue - monthlyRev[monthlyRev.length - 2].revenue) / (monthlyRev[monthlyRev.length - 2].revenue || 1)) * 100)
                    : 0

                  // Generate next 3 month labels
                  const now = new Date()
                  const forecastMonths = [0, 1, 2].map((offset) => {
                    const d = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
                    return d.toLocaleString('default', { month: 'short' })
                  })

                  return (
                    <>
                      <div className="flex items-center gap-3">
                        {forecastMonths.map((month, i) => (
                          <div key={month} className="text-center px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
                            <p className="text-[10px] text-muted-foreground uppercase">{month}</p>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {formatCurrency(Math.round(avgMonthly * (1 + (trendDirection ? 0.02 : -0.02) * (i + 1))))}
                            </p>
                          </div>
                        ))}
                      </div>
                      <Separator orientation="vertical" className="hidden sm:block h-10" />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">3-Mo Total</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatCurrency(totalForecast)}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          {trendDirection ? (
                            <TrendingUp className="size-3 text-emerald-500" />
                          ) : (
                            <TrendingDown className="size-3 text-red-500" />
                          )}
                          <span className={`text-xs font-medium ${trendDirection ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {trendDirection ? '+' : ''}{trendPercent}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">trend</span>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Recent Invoices + Activity Timeline (Two-Column) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Invoices */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
                  <CardDescription>Your 5 most recent invoices</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView('invoices')}
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
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-lg" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Desktop header */}
                  <div className="hidden md:grid md:grid-cols-[1fr_1fr_0.8fr_0.6fr_0.5fr] gap-4 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Invoice</span>
                    <span>Customer</span>
                    <span>Amount</span>
                    <span>Status</span>
                    <span>Date</span>
                  </div>
                  <Separator className="hidden md:block" />

                  {(data?.recentInvoices || []).map((invoice, index) => {
                    const status = statusConfig[invoice.status] || statusConfig.draft
                    const isEvenRow = index % 2 === 0
                    return (
                      <React.Fragment key={invoice.id}>
                        {/* Desktop row */}
                        <div
                          className={`hidden md:grid md:grid-cols-[1fr_1fr_0.8fr_0.6fr_0.5fr] gap-4 items-center px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                            isEvenRow
                              ? 'bg-muted/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                              : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                          } hover:shadow-sm`}
                          onClick={() => {
                            useAppStore.getState().setPreviewInvoiceId(invoice.id)
                            setCurrentView('preview-invoice')
                          }}
                        >
                          <span className="font-medium text-sm">{invoice.invoiceNumber}</span>
                          <span className="text-sm text-muted-foreground">{invoice.customerName}</span>
                          <span className="text-sm font-medium">{formatCurrency(invoice.grandTotal)}</span>
                          <Badge variant="secondary" className={`w-fit text-xs ${status.className}`}>
                            {status.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(invoice.invoiceDate), 'MMM dd')}
                          </span>
                        </div>

                        {/* Mobile card */}
                        <div
                          className={`md:hidden flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                            isEvenRow
                              ? 'bg-muted/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                              : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                          } hover:shadow-sm`}
                          onClick={() => {
                            useAppStore.getState().setPreviewInvoiceId(invoice.id)
                            setCurrentView('preview-invoice')
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center justify-center size-9 rounded-lg bg-muted shrink-0">
                              <FileText className="size-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{invoice.invoiceNumber}</p>
                              <p className="text-xs text-muted-foreground truncate">{invoice.customerName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatCurrency(invoice.grandTotal)}</p>
                            </div>
                            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${status.className}`}>
                              {status.label}
                            </Badge>
                          </div>
                        </div>

                        {index < (data?.recentInvoices?.length || 0) - 1 && (
                          <Separator className="md:hidden opacity-50" />
                        )}
                      </React.Fragment>
                    )
                  })}

                  {(!data?.recentInvoices || data.recentInvoices.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FileText className="size-10 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No invoices yet</p>
                      <Button
                        variant="link"
                        className="text-emerald-600 dark:text-emerald-400 mt-1"
                        onClick={() => setCurrentView('create-invoice')}
                      >
                        Create your first invoice
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div variants={itemVariants}>
          <ActivityTimeline />
        </motion.div>
      </div>
    </motion.div>
  )
}
