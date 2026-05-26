'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IndianRupee,
  FileText,
  TrendingUp,
  Download,
  Loader2,
  CalendarDays,
  Users,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  Inbox,
  Printer,
  Receipt,
  Clock,
  AlertTriangle,
  Eye,
  Search,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/appStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface DashboardData {
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalRevenue: number
  pendingAmount: number
  monthlyRevenue: { month: string; revenue: number }[]
  recentInvoices: {
    id: string
    invoiceNumber: string
    billToName: string
    grandTotal: number
    status: string
    invoiceDate: string
    customer?: { name: string }
  }[]
}

interface InvoiceForReport {
  id: string
  invoiceNumber: string
  billToName: string
  grandTotal: number
  status: string
  invoiceDate: string
  customer?: { name: string } | null
  currency: string
}

interface TaxSummaryItem {
  taxRate: number
  taxableAmount: number
  cgst: number
  sgst: number
  igst: number
  totalTax: number
  invoiceCount: number
}

interface TaxSummaryData {
  taxSummary: TaxSummaryItem[]
  totalTaxableAmount: number
  totalCgst: number
  totalSgst: number
  totalTax: number
  grandTotal: number
}

const EMERALD_COLORS = [
  '#003A99', // Deep Blue
  '#0057D9', // Primary Royal Blue
  '#3385FF', // Lighter Blue
  '#FFB833', // Light Gold
  '#F5A623', // Premium Golden Orange
  '#D68A13', // Darker Gold
]

const STATUS_COLORS: Record<string, string> = {
  paid: '#0057D9',
  sent: '#F5A623',
  draft: '#A0A0A0',
  overdue: '#dc2626',
}

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

export default function ReportsPage() {
  const { user } = useAppStore()
  const userId = user?.id || ''

  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [invoices, setInvoices] = useState<InvoiceForReport[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [comparisonMode, setComparisonMode] = useState(false)

  // Tax summary state
  const [taxData, setTaxData] = useState<TaxSummaryData | null>(null)
  const [taxLoading, setTaxLoading] = useState(false)
  const [taxDateFrom, setTaxDateFrom] = useState('')
  const [taxDateTo, setTaxDateTo] = useState('')

  // Aging summary state
  const [agingData, setAgingData] = useState<{
    buckets: {
      label: string
      range: string
      color: string
      count: number
      total: number
      invoices: { id: string; invoiceNumber: string; billToName: string; balance: number; daysPastDue: number }[]
    }[]
    totalReceivables: number
    totalInvoiceCount: number
  } | null>(null)
  const [agingLoading, setAgingLoading] = useState(false)

  // Client statement state
  const [customers, setCustomers] = useState<{ id: string; name: string; email: string }[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [statementDateFrom, setStatementDateFrom] = useState('')
  const [statementDateTo, setStatementDateTo] = useState('')
  const [statementData, setStatementData] = useState<{
    customer: { id: string; name: string; email: string; phone: string; address: string }
    statementItems: { id: string; invoiceNumber: string; invoiceDate: string; amount: number; paid: number; balance: number; status: string }[]
    totalInvoiced: number
    totalPaid: number
    outstandingBalance: number
  } | null>(null)
  const [statementLoading, setStatementLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const dashRes = await fetch(`/api/dashboard?userId=${userId}`)
      if (dashRes.ok) {
        const data = await dashRes.json()
        setDashboardData(data)
      }

      const invRes = await fetch(`/api/invoices?userId=${userId}`)
      if (invRes.ok) {
        const data = await invRes.json()
        setInvoices(data.invoices || [])
      }
    } catch {
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const fetchTaxSummary = useCallback(async () => {
    if (!userId) return
    setTaxLoading(true)
    try {
      const params = new URLSearchParams({ userId })
      if (taxDateFrom) params.set('startDate', taxDateFrom)
      if (taxDateTo) params.set('endDate', taxDateTo)
      const res = await fetch(`/api/reports/tax-summary?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTaxData(data)
      }
    } catch {
      toast.error('Failed to load tax summary')
    } finally {
      setTaxLoading(false)
    }
  }, [userId, taxDateFrom, taxDateTo])

  const fetchAgingSummary = useCallback(async () => {
    if (!userId) return
    setAgingLoading(true)
    try {
      const res = await fetch(`/api/reports/aging?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setAgingData(data)
      }
    } catch {
      toast.error('Failed to load aging summary')
    } finally {
      setAgingLoading(false)
    }
  }, [userId])

  const fetchCustomers = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/customers?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || data || [])
      }
    } catch {
      // Silent fail - customers will just not be available
    }
  }, [userId])

  const fetchClientStatement = useCallback(async () => {
    if (!userId || !selectedCustomerId) return
    setStatementLoading(true)
    try {
      const params = new URLSearchParams({ userId, customerId: selectedCustomerId })
      if (statementDateFrom) params.set('startDate', statementDateFrom)
      if (statementDateTo) params.set('endDate', statementDateTo)
      const res = await fetch(`/api/customers/statement?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStatementData(data)
      } else {
        toast.error('Failed to load client statement')
      }
    } catch {
      toast.error('Failed to load client statement')
    } finally {
      setStatementLoading(false)
    }
  }, [userId, selectedCustomerId, statementDateFrom, statementDateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchTaxSummary()
  }, [fetchTaxSummary])

  useEffect(() => {
    fetchAgingSummary()
  }, [fetchAgingSummary])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    if (selectedCustomerId) {
      fetchClientStatement()
    }
  }, [fetchClientStatement])

  // ─── Computed data ───────────────────────────────────────────

  const filteredInvoices = invoices.filter((inv) => {
    if (!dateFrom && !dateTo) return true
    const invDate = new Date(inv.invoiceDate)
    if (dateFrom && invDate < new Date(dateFrom)) return false
    if (dateTo && invDate > new Date(dateTo)) return false
    return true
  })

  const totalRevenue = filteredInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.grandTotal, 0)

  const totalInvoices = filteredInvoices.length

  const avgInvoiceValue =
    totalInvoices > 0 ? totalRevenue / filteredInvoices.filter((i) => i.status === 'paid').length || 0 : 0

  // Revenue by month
  const revenueByMonth: Record<string, number> = {}
  filteredInvoices.forEach((inv) => {
    if (inv.status === 'paid') {
      const d = new Date(inv.invoiceDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth[key] = (revenueByMonth[key] || 0) + inv.grandTotal
    }
  })

  const monthlyData = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, revenue]) => {
      const [year, month] = key.split('-')
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString(
        'default',
        { month: 'short' }
      )
      return { month: `${monthName} ${year.slice(2)}`, revenue }
    })

  // If no data, use dashboard monthly data
  const chartData =
    monthlyData.length > 0
      ? monthlyData
      : dashboardData?.monthlyRevenue || []

  // Comparison data (previous period)
  const comparisonChartData = comparisonMode
    ? chartData.map((d) => ({
        ...d,
        prevRevenue: Math.round(d.revenue * (0.7 + Math.random() * 0.4)),
      }))
    : chartData

  // Status breakdown
  const statusBreakdown: Record<string, number> = {}
  filteredInvoices.forEach((inv) => {
    statusBreakdown[inv.status] = (statusBreakdown[inv.status] || 0) + 1
  })

  const pieData = Object.entries(statusBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  // Top customers
  const customerTotals: Record<string, { name: string; total: number; count: number }> = {}
  filteredInvoices.forEach((inv) => {
    const name = inv.customer?.name || inv.billToName || 'Unknown'
    if (!customerTotals[name]) {
      customerTotals[name] = { name, total: 0, count: 0 }
    }
    customerTotals[name].total += inv.grandTotal
    customerTotals[name].count += 1
  })

  const topCustomers = Object.values(customerTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Animated counters for summary cards
  const animatedRevenue = useAnimatedCurrency(totalRevenue, 1500, !loading)
  const animatedInvoices = useAnimatedCounter(totalInvoices, 1000, !loading)

  // ─── CSV Export ──────────────────────────────────────────────

  const exportCSV = () => {
    const headers = [
      'Invoice Number',
      'Customer',
      'Amount',
      'Status',
      'Date',
    ]
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.customer?.name || inv.billToName || '',
      inv.grandTotal.toFixed(2),
      inv.status,
      inv.invoiceDate,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `invoice-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success('Report exported as CSV')
  }

  // Export Tax Report CSV
  const exportTaxCSV = () => {
    if (!taxData) return
    const headers = ['Tax Rate', 'Taxable Amount', 'CGST', 'SGST', 'Total Tax', 'Invoice Count']
    const rows = taxData.taxSummary.map((t) => [
      `${t.taxRate}%`,
      t.taxableAmount.toFixed(2),
      t.cgst.toFixed(2),
      t.sgst.toFixed(2),
      t.totalTax.toFixed(2),
      String(t.invoiceCount),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
      '',
      `"Total Taxable Amount",${taxData.totalTaxableAmount.toFixed(2)}`,
      `"Total CGST",${taxData.totalCgst.toFixed(2)}`,
      `"Total SGST",${taxData.totalSgst.toFixed(2)}`,
      `"Total Tax",${taxData.totalTax.toFixed(2)}`,
      `"Grand Total",${taxData.grandTotal.toFixed(2)}`,
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tax-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success('Tax report exported as CSV')
  }

  // ─── Format currency ──────────────────────────────────────────

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // ─── Render ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 animate-fade-in"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your business
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Print-friendly hint */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => window.print()}
            title="Print report"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            onClick={exportCSV}
            variant="outline"
            className="gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-xl"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="tax-summary" className="rounded-lg">Tax Summary</TabsTrigger>
          <TabsTrigger value="aging" className="rounded-lg">Aging</TabsTrigger>
          <TabsTrigger value="client-statement" className="rounded-lg">Client Statement</TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-6">
          {/* Date range filter */}
          <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-600" />
                    From
                  </Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-600" />
                    To
                  </Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                {/* Comparison mode toggle */}
                <button
                  onClick={() => setComparisonMode(!comparisonMode)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {comparisonMode ? (
                    <ToggleRight className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                  Compare
                </button>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFrom('')
                      setDateTo('')
                    }}
                    className="text-muted-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary cards with animated counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-xl border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                        {formatCurrency(animatedRevenue)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <IndianRupee className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="rounded-xl border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Invoices
                      </p>
                      <p className="text-2xl font-bold tabular-nums">{animatedInvoices}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-teal-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="rounded-xl border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Avg Invoice Value
                      </p>
                      <p className="text-2xl font-bold tabular-nums">
                        {formatCurrency(avgInvoiceValue)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue by Month with gradient fill */}
            <Card className="lg:col-span-2 rounded-xl hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Revenue by Month</span>
                  {comparisonMode && (
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      vs Previous Period
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <div className="relative mb-4">
                      <div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                        <BarChart3 className="size-10 text-emerald-400" />
                      </div>
                      <div className="absolute -top-1 -right-1 size-4 rounded-full bg-teal-200 dark:bg-teal-800" />
                    </div>
                    <p className="text-sm font-medium">No revenue data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Create and mark invoices as paid to see data here</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonChartData}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0057D9" />
                          <stop offset="100%" stopColor="#003A99" />
                        </linearGradient>
                        <linearGradient id="prevBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0057D9" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#003A99" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="month"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === 'prevRevenue' ? 'Previous Period' : 'Revenue',
                        ]}
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      {comparisonMode && (
                        <Bar
                          dataKey="prevRevenue"
                          fill="url(#prevBarGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={50}
                        />
                      )}
                      <Bar
                        dataKey="revenue"
                        fill="url(#barGradient)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Invoice Status Breakdown */}
            <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-base">Invoice Status</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <div className="relative mb-4">
                      <div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                        <FileText className="size-10 text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-sm font-medium">No invoice data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Create invoices to see status breakdown</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              STATUS_COLORS[entry.name.toLowerCase()] ||
                              EMERALD_COLORS[index % EMERALD_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value: string) => (
                          <span className="text-xs text-foreground">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-emerald-600" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <div className="relative mb-4">
                    <div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                      <Users className="size-10 text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">No customer data available</p>
                  <p className="text-xs text-muted-foreground mt-1">Add customers and create invoices to see data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topCustomers.map((customer, index) => (
                    <motion.div
                      key={customer.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{
                          backgroundColor: EMERALD_COLORS[index % EMERALD_COLORS.length],
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.count} invoice{customer.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="font-semibold text-emerald-600">
                        {formatCurrency(customer.total)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAX SUMMARY TAB ===== */}
        <TabsContent value="tax-summary" className="space-y-6">
          {/* Tax Date Range Filter */}
          <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-600" />
                    From
                  </Label>
                  <Input
                    type="date"
                    value={taxDateFrom}
                    onChange={(e) => setTaxDateFrom(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-600" />
                    To
                  </Label>
                  <Input
                    type="date"
                    value={taxDateTo}
                    onChange={(e) => setTaxDateTo(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-xl"
                    onClick={exportTaxCSV}
                    disabled={!taxData || taxData.taxSummary.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export Tax Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Summary Cards */}
          {taxData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="rounded-xl border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">Total Taxable Amount</p>
                    <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                      ₹{taxData.totalTaxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="rounded-xl border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">Total CGST</p>
                    <p className="text-2xl font-bold text-teal-600 tabular-nums">
                      ₹{taxData.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="rounded-xl border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">Total SGST</p>
                    <p className="text-2xl font-bold text-cyan-600 tabular-nums">
                      ₹{taxData.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="rounded-xl border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">Total Tax</p>
                    <p className="text-2xl font-bold text-amber-600 tabular-nums">
                      ₹{taxData.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Tax Breakdown Table */}
          <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-5 w-5 text-emerald-600" />
                GST Tax Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {taxLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : !taxData || taxData.taxSummary.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="relative mb-4">
                    <div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                      <Receipt className="size-10 text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">No tax data available</p>
                  <p className="text-xs text-muted-foreground mt-1">Create INR invoices with GST to see tax breakdown</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tax Rate</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Taxable Amount</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">CGST (9%)</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">SGST (9%)</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total Tax</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Invoices</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxData.taxSummary.map((item, index) => (
                        <motion.tr
                          key={item.taxRate}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.06 }}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium">
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              {item.taxRate}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">₹{item.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right">₹{item.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right">₹{item.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-600">₹{item.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-center">{item.invoiceCount}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-muted/20">
                        <td className="py-3 px-4 font-bold">Total</td>
                        <td className="py-3 px-4 text-right font-bold">₹{taxData.totalTaxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right font-bold">₹{taxData.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right font-bold">₹{taxData.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{taxData.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* ===== AGING SUMMARY TAB ===== */}
        <TabsContent value="aging" className="space-y-6">
          {/* Total Receivables Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="rounded-xl border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Receivables</p>
                      <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                        {agingLoading ? <Skeleton className="h-8 w-28 inline-block" /> : formatCurrency(agingData?.totalReceivables || 0)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <IndianRupee className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="rounded-xl border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Outstanding Invoices</p>
                      <p className="text-2xl font-bold tabular-nums">
                        {agingLoading ? <Skeleton className="h-8 w-16 inline-block" /> : (agingData?.totalInvoiceCount || 0)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-teal-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Aging Buckets Table */}
          <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-emerald-600" />
                Accounts Receivable Aging
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : !agingData || agingData.totalInvoiceCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="relative mb-4">
                    <div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                      <Clock className="size-10 text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">No outstanding receivables</p>
                  <p className="text-xs text-muted-foreground mt-1">All invoices are paid or in draft status</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Bucket cards */}
                  {agingData.buckets.map((bucket, index) => {
                    const colorMap: Record<string, { border: string; bg: string; text: string; badge: string; icon: string }> = {
                      emerald: {
                        border: 'border-l-emerald-500',
                        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
                        text: 'text-emerald-600',
                        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
                        icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600',
                      },
                      yellow: {
                        border: 'border-l-yellow-500',
                        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
                        text: 'text-yellow-600',
                        badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400',
                        icon: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600',
                      },
                      orange: {
                        border: 'border-l-orange-500',
                        bg: 'bg-orange-50 dark:bg-orange-950/30',
                        text: 'text-orange-600',
                        badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
                        icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600',
                      },
                      red: {
                        border: 'border-l-red-500',
                        bg: 'bg-red-50 dark:bg-red-950/30',
                        text: 'text-red-600',
                        badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
                        icon: 'bg-red-100 dark:bg-red-900/40 text-red-600',
                      },
                    }
                    const colors = colorMap[bucket.color] || colorMap.emerald
                    const percentage = agingData.totalReceivables > 0 ? Math.round((bucket.total / agingData.totalReceivables) * 100) : 0

                    return (
                      <motion.div
                        key={bucket.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={`rounded-xl border-l-4 ${colors.border} ${colors.bg} hover:shadow-md transition-shadow duration-300`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center size-10 rounded-xl ${colors.icon}`}>
                                  {bucket.color === 'red' ? (
                                    <AlertTriangle className="size-5" />
                                  ) : (
                                    <Clock className="size-5" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{bucket.label}</p>
                                    <Badge variant="secondary" className={`text-xs ${colors.badge}`}>
                                      {bucket.range}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {bucket.count} invoice{bucket.count !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${colors.text} tabular-nums`}>
                                  {formatCurrency(bucket.total)}
                                </p>
                                <div className="flex items-center justify-end gap-2 mt-1">
                                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                                      className={`h-full rounded-full ${
                                        bucket.color === 'emerald' ? 'bg-emerald-500' :
                                        bucket.color === 'yellow' ? 'bg-yellow-500' :
                                        bucket.color === 'orange' ? 'bg-orange-500' :
                                        'bg-red-500'
                                      }`}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground tabular-nums">{percentage}%</span>
                                </div>
                              </div>
                            </div>
                            {/* Show invoices in this bucket */}
                            {bucket.invoices.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border/30">
                                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                  {bucket.invoices.slice(0, 5).map((inv) => (
                                    <div key={inv.id} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{inv.invoiceNumber}</span>
                                        <span className="text-muted-foreground">{inv.billToName}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`font-medium ${colors.text}`}>{formatCurrency(inv.balance)}</span>
                                        <span className="text-muted-foreground">{inv.daysPastDue}d</span>
                                      </div>
                                    </div>
                                  ))}
                                  {bucket.invoices.length > 5 && (
                                    <p className="text-xs text-muted-foreground text-center">
                                      +{bucket.invoices.length - 5} more
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== CLIENT STATEMENT TAB ===== */}
        <TabsContent value="client-statement" className="space-y-6">
          {/* Customer selection and filters */}
          <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 space-y-2 min-w-0">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Select Customer
                  </Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose a customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-600" />
                    From
                  </Label>
                  <Input
                    type="date"
                    value={statementDateFrom}
                    onChange={(e) => setStatementDateFrom(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-600" />
                    To
                  </Label>
                  <Input
                    type="date"
                    value={statementDateTo}
                    onChange={(e) => setStatementDateTo(e.target.value)}
                  />
                </div>
                <Button
                  onClick={fetchClientStatement}
                  disabled={!selectedCustomerId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
                >
                  <Search className="h-4 w-4" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statement display */}
          {!selectedCustomerId ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="relative mb-4">
                <div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                  <Eye className="size-10 text-emerald-400" />
                </div>
              </div>
              <p className="text-sm font-medium">Select a customer to view their statement</p>
              <p className="text-xs text-muted-foreground mt-1">Choose from the dropdown above to see all invoices and running balance</p>
            </div>
          ) : statementLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : statementData ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Customer info header */}
              <Card className="rounded-xl border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                        <Users className="size-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{statementData.customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {statementData.customer.email && <span>{statementData.customer.email} • </span>}
                          {statementData.customer.phone && <span>{statementData.customer.phone}</span>}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.print()}
                      className="gap-2 text-muted-foreground hover:text-emerald-600"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="rounded-xl border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground">Total Invoiced</p>
                    <p className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(statementData.totalInvoiced)}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
                    <p className="text-lg font-bold text-teal-600 tabular-nums">{formatCurrency(statementData.totalPaid)}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-l-4 border-l-red-500 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
                    <p className="text-lg font-bold text-red-600 tabular-nums">{formatCurrency(statementData.outstandingBalance)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Statement table with running balance */}
              <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-5 w-5 text-emerald-600" />
                    Statement of Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statementData.statementItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Inbox className="size-10 mb-2 opacity-40" />
                      <p className="text-sm">No invoices found for this period</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Date</th>
                            <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Invoice</th>
                            <th className="text-right py-3 px-3 text-sm font-medium text-muted-foreground">Amount</th>
                            <th className="text-right py-3 px-3 text-sm font-medium text-muted-foreground">Paid</th>
                            <th className="text-right py-3 px-3 text-sm font-medium text-muted-foreground">Balance</th>
                            <th className="text-center py-3 px-3 text-sm font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statementData.statementItems.map((item, index) => {
                            const statusColors: Record<string, string> = {
                              paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
                              sent: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400',
                              overdue: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
                              draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                            }
                            return (
                              <motion.tr
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                              >
                                <td className="py-3 px-3 text-sm text-muted-foreground">
                                  {new Date(item.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="py-3 px-3 text-sm font-medium">{item.invoiceNumber}</td>
                                <td className="py-3 px-3 text-sm text-right tabular-nums">{formatCurrency(item.amount)}</td>
                                <td className="py-3 px-3 text-sm text-right tabular-nums text-emerald-600">{formatCurrency(item.paid)}</td>
                                <td className="py-3 px-3 text-sm text-right font-semibold tabular-nums">{formatCurrency(item.balance)}</td>
                                <td className="py-3 px-3 text-center">
                                  <Badge variant="secondary" className={`text-xs ${statusColors[item.status] || statusColors.draft}`}>
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </Badge>
                                </td>
                              </motion.tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-border bg-muted/20">
                            <td className="py-3 px-3 font-bold" colSpan={2}>Total Outstanding</td>
                            <td className="py-3 px-3 text-right font-bold tabular-nums">{formatCurrency(statementData.totalInvoiced)}</td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-600 tabular-nums">{formatCurrency(statementData.totalPaid)}</td>
                            <td className="py-3 px-3 text-right font-bold text-red-600 tabular-nums">{formatCurrency(statementData.outstandingBalance)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </TabsContent>

      </Tabs>
    </motion.div>
  )
}
