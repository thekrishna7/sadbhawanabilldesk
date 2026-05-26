'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Clock,
  FileText,
  Info,
  ShieldAlert,
  Archive,
  CircleCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/appStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DeletedInvoice {
  id: string
  invoiceNumber: string
  billToName: string
  grandTotal: number
  status: string
  invoiceDate: string
  deletedAt: string
  permanentDeleteAt: string
  customer?: { name: string } | null
}

// ===== Stagger animation =====
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

export default function RecycleBinPage() {
  const { user } = useAppStore()
  const userId = user?.id || ''

  const [invoices, setInvoices] = useState<DeletedInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [recoverId, setRecoverId] = useState<string | null>(null)
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchDeletedInvoices = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/invoices?userId=${userId}&status=deleted`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch {
      toast.error('Failed to load deleted invoices')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchDeletedInvoices()
  }, [fetchDeletedInvoices])

  const handleRecover = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/invoices/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        toast.success('Invoice recovered successfully')
        setRecoverId(null)
        fetchDeletedInvoices()
      } else {
        toast.error('Failed to recover invoice')
      }
    } catch {
      toast.error('Failed to recover invoice')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePermanentDelete = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/invoices/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, permanent: true }),
      })
      if (res.ok) {
        toast.success('Invoice permanently deleted')
        setPermanentDeleteId(null)
        fetchDeletedInvoices()
      } else {
        toast.error('Failed to delete invoice')
      }
    } catch {
      toast.error('Failed to delete invoice')
    } finally {
      setActionLoading(null)
    }
  }

  const getDaysRemaining = (permanentDeleteAt: string) => {
    const now = new Date()
    const deleteDate = new Date(permanentDeleteAt)
    const diff = deleteDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const getDaysSinceDeleted = (deletedAt: string) => {
    const now = new Date()
    const deleted = new Date(deletedAt)
    const diff = now.getTime() - deleted.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Urgency colors: green > 5 days, amber 3-5, red < 3
  const getUrgencyColor = (days: number) => {
    if (days > 5) return 'emerald'
    if (days >= 3) return 'amber'
    return 'red'
  }

  const getUrgencyClasses = (days: number) => {
    const color = getUrgencyColor(days)
    return {
      border: color === 'emerald' ? 'border-l-emerald-500' : color === 'amber' ? 'border-l-amber-500' : 'border-l-red-500',
      badge: color === 'emerald'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : color === 'amber'
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      cardBg: color === 'red' ? 'bg-red-50/30 dark:bg-red-950/10' : '',
      pulse: days <= 2 ? 'animate-countdown-pulse' : '',
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading recycle bin...</p>
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
      {/* Warning Gradient Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-red-500 to-rose-500 p-6 text-white shadow-sm">
        <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute bottom-0 left-1/4 size-16 rounded-full bg-white/10 blur-lg" />
        <div className="absolute top-2 right-20">
          <Trash2 className="size-20 text-white/10" />
        </div>
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            Recycle Bin
          </h1>
          <p className="text-white/80 mt-1">
            Recover or permanently delete invoices
          </p>
        </div>
      </div>

      {/* Notice */}
      <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-300">
          Deleted invoices will remain in the recycle bin for <strong>7 days</strong>. After that, they will be permanently deleted.
        </AlertDescription>
      </Alert>

      <AnimatePresence mode="wait">
        {invoices.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="rounded-xl shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="size-28 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                    <Archive className="size-14 text-emerald-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 size-8 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
                    <CircleCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Recycle bin is empty</h3>
                <p className="text-sm text-muted-foreground max-w-sm text-center">
                  When you delete invoices, they&apos;ll appear here for 7 days before permanent removal.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <AnimatePresence>
              {invoices.map((invoice) => {
                const daysRemaining = getDaysRemaining(invoice.permanentDeleteAt)
                const daysSinceDeleted = getDaysSinceDeleted(invoice.deletedAt)
                const urgency = getUrgencyClasses(daysRemaining)
                const isCritical = daysRemaining <= 2

                return (
                  <motion.div
                    key={invoice.id}
                    variants={itemVariants}
                    exit={{ opacity: 0, x: -100 }}
                  >
                    <Card
                      className={`transition-all duration-200 rounded-xl shadow-sm border-l-4 ${urgency.border} ${urgency.cardBg} hover:-translate-y-0.5 hover:shadow-md`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Invoice info */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">
                                {invoice.invoiceNumber}
                              </h3>
                              <Badge
                                variant="secondary"
                                className={`${urgency.badge} ${urgency.pulse}`}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                              </Badge>
                              {isCritical && (
                                <Badge
                                  variant="destructive"
                                  className="gap-1 animate-countdown-pulse"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  Expiring soon
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">
                                {invoice.customer?.name || invoice.billToName || 'Unknown'}
                              </span>
                              {' · '}
                              {formatCurrency(invoice.grandTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Deleted on {formatDate(invoice.deletedAt)} · Invoice date: {formatDate(invoice.invoiceDate)}
                            </p>
                            {daysSinceDeleted > 5 && (
                              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                This invoice has been in the bin for {daysSinceDeleted} days and will be permanently deleted soon
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRecoverId(invoice.id)}
                              disabled={actionLoading === invoice.id}
                              className="gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-sm"
                            >
                              {actionLoading === invoice.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                              Recover
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPermanentDeleteId(invoice.id)}
                              disabled={actionLoading === invoice.id}
                              className="gap-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 text-red-700 dark:text-red-400 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Forever
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recover Confirmation */}
      <AlertDialog
        open={!!recoverId}
        onOpenChange={() => setRecoverId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recover Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to recover this invoice? It will be moved
              back to your invoices list with &quot;draft&quot; status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => recoverId && handleRecover(recoverId)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Recover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation */}
      <AlertDialog
        open={!!permanentDeleteId}
        onOpenChange={() => setPermanentDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Permanent Delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this invoice? This
              action <strong>cannot be undone</strong>. The invoice and all its
              items will be removed forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                permanentDeleteId && handlePermanentDelete(permanentDeleteId)
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
