'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  FileText,
  LayoutGrid,
  List,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  FileEdit,
  Calendar,
  IndianRupee,
  Loader2,
  Inbox,
  ArrowRight,
  Copy,
  DollarSign,
  CheckSquare,
  Square,
  X,
  SendHorizontal,
  Banknote,
  GripVertical,
  PartyPopper,
  Bell,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import { getCurrencySymbol } from '@/lib/currency'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  taxPercent: number
  amount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  status: string
  billToName: string
  billToPhone: string
  billToEmail: string
  billToAddress: string
  subtotal: number
  taxTotal: number
  grandTotal: number
  receivedAmount: number
  previousBalance: number
  currentBalance: number
  amountInWords: string
  termsText: string
  currency: string
  items: InvoiceItem[]
  createdAt: string
}

type FilterStatus = 'all' | 'draft' | 'sent' | 'paid' | 'overdue'
type ViewMode = 'grid' | 'list'

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    icon: <FileEdit className="w-3 h-3" />,
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    icon: <Send className="w-3 h-3" />,
  },
  paid: {
    label: 'Paid',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    icon: <AlertTriangle className="w-3 h-3 animate-overdue-pulse" />,
  },
}

export default function InvoiceList() {
  const { user, setCurrentView, setPreviewInvoiceId, setEditInvoiceId } = useAppStore()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  // Record Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)

  // Duplicate loading
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  // Send reminder loading
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null)

  const handleSendReminder = async (invoice: Invoice) => {
    if (!user?.id) return
    setSendingReminderId(invoice.id)
    try {
      const res = await fetch('/api/invoices/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, userId: user.id }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.emailSent) {
          toast.success(`Payment reminder email sent successfully to ${data.to}!`)
        } else {
          toast.warning(`Reminder logged in activities, but email not sent: ${data.emailError || 'Email not configured'}`)
        }
      } else {
        toast.error(data.error || 'Failed to send payment reminder')
      }
    } catch {
      toast.error('Failed to send payment reminder')
    } finally {
      setSendingReminderId(null)
    }
  }

  const fetchInvoices = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ userId: user.id })
      if (activeFilter !== 'all') params.set('status', activeFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/invoices?${params.toString()}`)
      const data = await res.json()
      if (data.invoices) setInvoices(data.invoices)
    } catch {
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [user?.id, activeFilter, search])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch('/api/invoices/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteId }),
      })
      if (res.ok) {
        toast.success('Invoice moved to recycle bin')
        setInvoices(prev => prev.filter(inv => inv.id !== deleteId))
      } else {
        toast.error('Failed to delete invoice')
      }
    } catch {
      toast.error('Failed to delete invoice')
    } finally {
      setDeleteId(null)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingStatus(id)
    try {
      const res = await fetch('/api/invoices/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Invoice marked as ${newStatus}`)
        setInvoices(prev =>
          prev.map(inv => (inv.id === id ? { ...inv, status: newStatus } : inv))
        )
        if (newStatus === 'paid') {
          triggerConfetti(id)
        }
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to update invoice status')
      }
    } catch {
      toast.error('Failed to update invoice status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // ===== Duplicate Invoice =====
  const handleDuplicate = async (invoice: Invoice) => {
    if (!user?.id) return
    setDuplicatingId(invoice.id)
    try {
      const res = await fetch('/api/invoices/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoice.id, userId: user.id }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Duplicated as ${data.invoice?.invoiceNumber || 'new invoice'}`)
        fetchInvoices()
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Failed to duplicate invoice')
      }
    } catch {
      toast.error('Failed to duplicate invoice')
    } finally {
      setDuplicatingId(null)
    }
  }

  // ===== Record Payment =====
  const openPaymentDialog = (invoice: Invoice) => {
    setPaymentInvoice(invoice)
    setPaymentAmount(String(invoice.currentBalance || invoice.grandTotal))
    setPaymentMethod('')
    setPaymentReference('')
    setPaymentNote('')
    setPaymentDialogOpen(true)
  }

  const handleRecordPayment = async () => {
    if (!paymentInvoice || !user?.id || !paymentAmount || !paymentMethod) return
    setPaymentLoading(true)
    try {
      const res = await fetch('/api/invoices/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: paymentInvoice.id,
          userId: user.id,
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          reference: paymentReference,
          note: paymentNote,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success('Payment recorded successfully')
        if (data.invoiceUpdate?.status === 'paid') {
          toast.success('Invoice auto-marked as paid')
        }
        fetchInvoices()
        setPaymentDialogOpen(false)
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Failed to record payment')
      }
    } catch {
      toast.error('Failed to record payment')
    } finally {
      setPaymentLoading(false)
    }
  }

  // ===== Bulk Actions =====
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(invoices.map(inv => inv.id)))
    }
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  const handleBulkAction = async (action: 'delete' | 'markSent' | 'markPaid') => {
    if (!user?.id || selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/invoices/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ids: Array.from(selectedIds),
          userId: user.id,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const actionLabels: Record<string, string> = {
          delete: 'deleted',
          markSent: 'marked as sent',
          markPaid: 'marked as paid',
        }
        toast.success(`${data.affectedCount} invoice(s) ${actionLabels[action]}`)
        fetchInvoices()
        exitSelectionMode()
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Bulk action failed')
      }
    } catch {
      toast.error('Bulk action failed')
    } finally {
      setBulkLoading(false)
    }
  }

  // Determine available status transitions for an invoice
  const getStatusActions = (invoice: Invoice) => {
    const actions: { status: string; label: string; icon: React.ReactNode }[] = []

    if (invoice.status === 'draft') {
      actions.push({
        status: 'sent',
        label: 'Mark as Sent',
        icon: <Send className="mr-2 h-4 w-4" />,
      })
    }

    if (invoice.status === 'sent') {
      actions.push({
        status: 'paid',
        label: 'Mark as Paid',
        icon: <CheckCircle2 className="mr-2 h-4 w-4" />,
      })
      // Show "Mark as Overdue" if past due date
      if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
        actions.push({
          status: 'overdue',
          label: 'Mark as Overdue',
          icon: <AlertTriangle className="mr-2 h-4 w-4" />,
        })
      }
    }

    if (invoice.status === 'overdue') {
      actions.push({
        status: 'paid',
        label: 'Mark as Paid',
        icon: <CheckCircle2 className="mr-2 h-4 w-4" />,
      })
    }

    return actions
  }

  const handleView = (id: string) => {
    setPreviewInvoiceId(id)
    setCurrentView('preview-invoice')
  }

  const handleEdit = (id: string) => {
    setEditInvoiceId(id)
    setCurrentView('create-invoice')
  }

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'sent', label: 'Sent' },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
  ]

  // ===== Confetti on mark as paid =====
  const [confettiId, setConfettiId] = useState<string | null>(null)
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const triggerConfetti = (id: string) => {
    setConfettiId(id)
    if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current)
    confettiTimeoutRef.current = setTimeout(() => setConfettiId(null), 1500)
  }

  // Loading skeleton matching card layout with shimmer
  const LoadingSkeleton = () => (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <Card className="p-4 border-l-4 border-l-muted/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-36" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-1 w-4" />
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-1 w-4" />
                <Skeleton className="h-2 w-2 rounded-full" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )

  // Empty state - enhanced with illustration-style design
  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      {/* Illustration-style design with animated elements */}
      <div className="relative mb-6">
        <div className="size-28 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Inbox className="size-12 text-emerald-400" />
          </motion.div>
        </div>
        {/* Floating decorative elements */}
        <motion.div
          animate={{ y: [0, -3, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-2 -right-2 size-6 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center"
        >
          <Plus className="size-3 text-emerald-600 dark:text-emerald-400" />
        </motion.div>
        <div className="absolute -bottom-1 -left-1 size-4 rounded-full bg-teal-200 dark:bg-teal-800" />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 -right-4 size-2 rounded-full bg-emerald-300 dark:bg-emerald-700"
        />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">No invoices found</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm">
        {search || activeFilter !== 'all'
          ? 'Try adjusting your search or filter to find what you\'re looking for'
          : 'Create your first invoice and start managing your billing effortlessly'}
      </p>
      {!search && activeFilter === 'all' && (
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
          onClick={() => {
            setEditInvoiceId(null)
            setCurrentView('create-invoice')
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Your First Invoice
        </Button>
      )}
    </motion.div>
  )

  // Status workflow indicator for cards
  const StatusWorkflow = ({ currentStatus }: { currentStatus: string }) => {
    const steps = ['draft', 'sent', 'paid']
    const currentIndex = steps.indexOf(currentStatus === 'overdue' ? 'sent' : currentStatus)
    return (
      <div className="flex items-center gap-1 mt-1">
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <div
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i <= currentIndex
                  ? 'bg-emerald-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'w-4 h-0.5 transition-colors',
                  i < currentIndex
                    ? 'bg-emerald-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }

  // Color for status bar on left side
  const statusBarColor: Record<string, string> = {
    draft: 'border-l-gray-400 dark:border-l-gray-500',
    sent: 'border-l-sky-500 dark:border-l-sky-400',
    paid: 'border-l-emerald-500 dark:border-l-emerald-400',
    overdue: 'border-l-red-500 dark:border-l-red-400',
  }

  // Dropdown menu content for status actions
  const StatusDropdownItems = ({ invoice }: { invoice: Invoice }) => {
    const statusActions = getStatusActions(invoice)
    const isUpdating = updatingStatus === invoice.id
    const isDuplicating = duplicatingId === invoice.id
    return (
      <>
        <DropdownMenuItem onClick={() => handleView(invoice.id)}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEdit(invoice.id)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleDuplicate(invoice)}
          disabled={isDuplicating}
        >
          {isDuplicating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openPaymentDialog(invoice)}>
          <DollarSign className="mr-2 h-4 w-4" />
          Record Payment
        </DropdownMenuItem>
        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
          <DropdownMenuItem
            onClick={() => handleSendReminder(invoice)}
            disabled={sendingReminderId === invoice.id}
          >
            {sendingReminderId === invoice.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bell className="mr-2 h-4 w-4" />
            )}
            Send Payment Reminder
          </DropdownMenuItem>
        )}
        {statusActions.length > 0 && <DropdownMenuSeparator />}
        {statusActions.map(action => (
          <DropdownMenuItem
            key={action.status}
            onClick={() => handleStatusChange(invoice.id, action.status)}
            disabled={isUpdating}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setDeleteId(invoice.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </>
    )
  }

  // Invoice card for grid view with color-coded status bar & drag handle
  const InvoiceCard = ({ invoice, index }: { invoice: Invoice; index: number }) => {
    const status = statusConfig[invoice.status] || statusConfig.draft
    const isUpdating = updatingStatus === invoice.id
    const isSelected = selectedIds.has(invoice.id)
    const isConfetti = confettiId === invoice.id
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, delay: index * 0.04 }}
        className="relative"
      >
        {/* Confetti animation when marked as paid */}
        <AnimatePresence>
          {isConfetti && (
            <motion.div
              initial={{ opacity: 1, y: -10 }}
              animate={{ opacity: 0, y: 20 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute -top-2 right-6 z-10 flex items-center gap-1"
            >
              <PartyPopper className="size-5 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Paid!</span>
            </motion.div>
          )}
        </AnimatePresence>
        <Card
          className={cn(
            "group hover:shadow-md transition-all duration-200 cursor-pointer border-border/50 rounded-xl scale-100 hover:scale-[1.01] border-l-4 card-shine",
            statusBarColor[invoice.status] || 'border-l-gray-400',
            isSelected && "ring-2 ring-emerald-500 border-emerald-500/50"
          )}
          onClick={() => {
            if (selectionMode) {
              toggleSelection(invoice.id)
            } else {
              handleView(invoice.id)
            }
          }}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {/* Drag handle indicator */}
                <GripVertical className="size-4 text-muted-foreground/30 shrink-0" />
                {selectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSelection(invoice.id)
                    }}
                    className="shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="size-5 text-emerald-600" />
                    ) : (
                      <Square className="size-5 text-muted-foreground" />
                    )}
                  </button>
                )}
                <div>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {invoice.billToName || 'No customer'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge className={cn('text-[10px] px-2 py-0.5 border', status.color)}>
                  {status.icon}
                  <span className="ml-1">{status.label}</span>
                </Badge>
                {!selectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdownItems invoice={invoice} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <StatusWorkflow currentStatus={invoice.status} />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'dd MMM yyyy') : '-'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Due: {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd MMM yyyy') : '-'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                {invoice.createdAt ? formatDistanceToNow(new Date(invoice.createdAt), { addSuffix: true }) : `${invoice.items?.length || 0} item${(invoice.items?.length || 0) !== 1 ? 's' : ''}`}
              </span>
              <span className="font-semibold text-foreground flex items-center gap-0.5">
                {invoice.currency ? getCurrencySymbol(invoice.currency) : ''}{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Invoice row for list view with color-coded status bar & time ago
  const InvoiceRow = ({ invoice, index }: { invoice: Invoice; index: number }) => {
    const status = statusConfig[invoice.status] || statusConfig.draft
    const isUpdating = updatingStatus === invoice.id
    const isSelected = selectedIds.has(invoice.id)
    const isConfetti = confettiId === invoice.id
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        className="relative"
      >
        {/* Confetti animation when marked as paid */}
        <AnimatePresence>
          {isConfetti && (
            <motion.div
              initial={{ opacity: 1, y: -5 }}
              animate={{ opacity: 0, y: 15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute -top-1 right-8 z-10 flex items-center gap-1"
            >
              <PartyPopper className="size-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Paid!</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className={cn(
            "flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group border-l-4",
            statusBarColor[invoice.status] || 'border-l-gray-400',
            isSelected && "bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500/50"
          )}
          onClick={() => {
            if (selectionMode) {
              toggleSelection(invoice.id)
            } else {
              handleView(invoice.id)
            }
          }}
        >
          {/* Drag handle indicator */}
          <GripVertical className="size-4 text-muted-foreground/30 shrink-0" />
          {selectionMode && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleSelection(invoice.id)
              }}
              className="shrink-0"
            >
              {isSelected ? (
                <CheckSquare className="size-5 text-emerald-600" />
              ) : (
                <Square className="size-5 text-muted-foreground" />
              )}
            </button>
          )}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-semibold text-foreground truncate">
                {invoice.invoiceNumber}
              </p>
              <Badge className={cn('text-[10px] px-2 py-0.5 border flex-shrink-0', status.color)}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {invoice.billToName || 'No customer'} · {invoice.createdAt ? formatDistanceToNow(new Date(invoice.createdAt), { addSuffix: true }) : `${invoice.items?.length || 0} item(s)`}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-sm text-foreground">
              {invoice.currency ? getCurrencySymbol(invoice.currency) : ''}{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'dd MMM yyyy') : '-'}
            </p>
          </div>
          {!selectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <StatusDropdownItems invoice={invoice} />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track all your invoices
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
          onClick={() => {
            setEditInvoiceId(null)
            setCurrentView('create-invoice')
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Search, Filters, View Toggle, Selection Toggle */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Selection mode toggle */}
            <Button
              variant={selectionMode ? 'default' : 'outline'}
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl",
                selectionMode && "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
              onClick={() => {
                if (selectionMode) {
                  exitSelectionMode()
                } else {
                  setSelectionMode(true)
                }
              }}
              title={selectionMode ? 'Exit selection' : 'Select invoices'}
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter buttons with gradient bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 bg-gradient-to-r from-muted/30 via-transparent to-muted/30 rounded-xl px-2 py-1.5">
          {filters.map(filter => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'whitespace-nowrap text-xs rounded-xl',
                activeFilter === filter.key && 'bg-emerald-600 hover:bg-emerald-700 text-white'
              )}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
          {/* Select All in selection mode */}
          {selectionMode && invoices.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap text-xs rounded-xl"
              onClick={toggleSelectAll}
            >
              {selectedIds.size === invoices.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
      </div>

      {/* Content with smooth filter transitions */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSkeleton />
          </motion.div>
        ) : invoices.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState />
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {invoices.map((invoice, i) => (
                <InvoiceCard key={invoice.id} invoice={invoice} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1">
            <AnimatePresence>
              {invoices.map((invoice, i) => (
                <InvoiceRow key={invoice.id} invoice={invoice} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the invoice to the recycle bin. You can restore it within 7 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="size-5 text-emerald-600" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Record a payment for {paymentInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount ({paymentInvoice?.currency ? getCurrencySymbol(paymentInvoice.currency) : '₹'})</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                min="0"
                step="0.01"
              />
              {paymentInvoice && (
                <p className="text-xs text-muted-foreground">
                  Outstanding balance: {paymentInvoice?.currency ? getCurrencySymbol(paymentInvoice.currency) : '₹'}{(paymentInvoice.currentBalance || paymentInvoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Enter reference number"
              />
            </div>
            <div className="space-y-2">
              <Label>Note <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Add a note about this payment"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={paymentLoading || !paymentAmount || !paymentMethod}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {paymentLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="mr-2 h-4 w-4" />
              )}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 bg-card border border-border shadow-xl rounded-2xl px-4 py-3 backdrop-blur-lg">
              <span className="text-sm font-medium whitespace-nowrap">
                {selectedIds.size} selected
              </span>
              <div className="w-px h-6 bg-border" />
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs"
                onClick={() => handleBulkAction('markSent')}
                disabled={bulkLoading}
              >
                <SendHorizontal className="mr-1.5 h-3.5 w-3.5" />
                Mark as Sent
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs"
                onClick={() => handleBulkAction('markPaid')}
                disabled={bulkLoading}
              >
                <Banknote className="mr-1.5 h-3.5 w-3.5" />
                Mark as Paid
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-xl text-xs"
                onClick={() => handleBulkAction('delete')}
                disabled={bulkLoading}
              >
                {bulkLoading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Delete
              </Button>
              <div className="w-px h-6 bg-border" />
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl text-xs"
                onClick={exitSelectionMode}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
