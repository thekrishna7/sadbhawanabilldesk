'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Play,
  Pause,
  CalendarClock,
  MoreVertical,
  Check,
  Clock,
  Zap,
  Timer,
  Calendar,
  Repeat,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/appStore'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RecurringInvoice {
  id: string
  templateName: string
  frequency: string
  nextDate: string
  isActive: boolean
  billToName: string
  currency: string
  items: string
  termsText: string
  createdAt: string
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

// Updated color coding: weekly=amber, monthly=emerald, quarterly=teal, yearly=cyan
const FREQUENCY_COLORS: Record<string, string> = {
  weekly: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  monthly: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  quarterly: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
  yearly: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
}

const FREQUENCY_BORDER: Record<string, string> = {
  weekly: 'border-l-amber-500',
  monthly: 'border-l-emerald-500',
  quarterly: 'border-l-teal-500',
  yearly: 'border-l-cyan-500',
}

const FREQUENCY_ICON_BG: Record<string, string> = {
  weekly: 'from-amber-400 to-amber-600',
  monthly: 'from-emerald-400 to-emerald-600',
  quarterly: 'from-teal-400 to-teal-600',
  yearly: 'from-cyan-400 to-cyan-600',
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
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

export default function RecurringInvoicesPage() {
  const { user } = useAppStore()
  const userId = user?.id || ''

  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Form state
  const [formTemplateName, setFormTemplateName] = useState('')
  const [formFrequency, setFormFrequency] = useState('monthly')
  const [formNextDate, setFormNextDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formBillToName, setFormBillToName] = useState('')
  const [formCurrency, setFormCurrency] = useState('INR')

  const fetchRecurring = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/invoices/recurring?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setRecurringInvoices(data.recurringInvoices || [])
      }
    } catch {
      toast.error('Failed to load recurring invoices')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchRecurring()
  }, [fetchRecurring])

  const resetForm = () => {
    setFormTemplateName('')
    setFormFrequency('monthly')
    setFormNextDate(format(new Date(), 'yyyy-MM-dd'))
    setFormBillToName('')
    setFormCurrency('INR')
    setEditingId(null)
  }

  const openAddDialog = () => {
    resetForm()
    setShowAddDialog(true)
  }

  const openEditDialog = (ri: RecurringInvoice) => {
    setEditingId(ri.id)
    setFormTemplateName(ri.templateName)
    setFormFrequency(ri.frequency)
    setFormNextDate(ri.nextDate)
    setFormBillToName(ri.billToName)
    setFormCurrency(ri.currency)
    setShowAddDialog(true)
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    try {
      const url = '/api/invoices/recurring'
      const method = editingId ? 'PUT' : 'POST'
      const body: Record<string, unknown> = {
        userId,
        templateName: formTemplateName || 'Untitled Template',
        frequency: formFrequency,
        nextDate: formNextDate,
        billToName: formBillToName,
        currency: formCurrency,
      }
      if (editingId) body.id = editingId

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingId ? 'Template updated' : 'Template created')
        setShowAddDialog(false)
        resetForm()
        fetchRecurring()
      } else {
        toast.error('Failed to save template')
      }
    } catch {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (ri: RecurringInvoice) => {
    setTogglingId(ri.id)
    try {
      const res = await fetch('/api/invoices/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ri.id, isActive: !ri.isActive }),
      })
      if (res.ok) {
        toast.success(ri.isActive ? 'Template paused' : 'Template resumed')
        fetchRecurring()
      }
    } catch {
      toast.error('Failed to update template')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/invoices/recurring?id=${deleteId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Template deleted')
        setDeleteId(null)
        fetchRecurring()
      }
    } catch {
      toast.error('Failed to delete template')
    }
  }

  const handleGenerateNow = async (ri: RecurringInvoice) => {
    if (!userId) return
    try {
      const items = JSON.parse(ri.items || '[]')
      const res = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          billToName: ri.billToName,
          currency: ri.currency,
          invoiceDate: ri.nextDate,
          dueDate: ri.nextDate,
          items,
          termsText: ri.termsText,
          status: 'draft',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Invoice ${data.invoice?.invoiceNumber} generated from template!`)
        // Update next date
        const nextDates: Record<string, Date> = {
          weekly: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          monthly: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          quarterly: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          yearly: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }
        const nextDate = format(nextDates[ri.frequency] || nextDates.monthly, 'yyyy-MM-dd')
        await fetch('/api/invoices/recurring', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ri.id, nextDate }),
        })
        fetchRecurring()
      } else {
        toast.error('Failed to generate invoice')
      }
    } catch {
      toast.error('Failed to generate invoice')
    }
  }

  const getItemCount = (itemsStr: string): number => {
    try {
      const items = JSON.parse(itemsStr || '[]')
      return items.length
    } catch {
      return 0
    }
  }

  const getDaysUntilNext = (nextDate: string): number => {
    try {
      return differenceInDays(new Date(nextDate), new Date())
    } catch {
      return 0
    }
  }

  const getCountdownColor = (days: number): string => {
    if (days <= 1) return 'text-amber-600 dark:text-amber-400'
    if (days <= 7) return 'text-teal-600 dark:text-teal-400'
    return 'text-emerald-600 dark:text-emerald-400'
  }

  const getCountdownBg = (days: number): string => {
    if (days <= 1) return 'bg-amber-50 dark:bg-amber-950/30'
    if (days <= 7) return 'bg-teal-50 dark:bg-teal-950/30'
    return 'bg-emerald-50 dark:bg-emerald-950/30'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading recurring invoices...</p>
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
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 p-6 text-white shadow-sm">
        <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute bottom-0 left-1/4 size-16 rounded-full bg-white/10 blur-lg" />
        <div className="absolute top-2 right-20">
          <Repeat className="size-20 text-white/10" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarClock className="h-6 w-6" />
              Recurring Invoices
            </h1>
            <p className="text-white/80 mt-1">
              Manage your recurring invoice templates
            </p>
          </div>
          <Button
            onClick={openAddDialog}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {recurringInvoices.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="rounded-xl shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="size-28 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950 dark:to-emerald-950 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/50">
                    <CalendarClock className="size-14 text-teal-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 size-8 rounded-full bg-teal-200 dark:bg-teal-800 flex items-center justify-center animate-float">
                    <RefreshCw className="size-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="absolute -bottom-1 -left-2 size-6 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center animate-pulse-soft">
                    <Zap className="size-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No recurring invoices</h3>
                <p className="text-sm text-muted-foreground max-w-sm text-center mb-6">
                  Create recurring templates to auto-generate invoices on a schedule — weekly, monthly, quarterly, or yearly.
                </p>
                <Button
                  onClick={openAddDialog}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Template
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {recurringInvoices.map((ri) => {
                const daysUntilNext = getDaysUntilNext(ri.nextDate)
                const countdownColor = getCountdownColor(daysUntilNext)
                const countdownBg = getCountdownBg(daysUntilNext)
                const freqBorder = FREQUENCY_BORDER[ri.frequency] || FREQUENCY_BORDER.monthly
                const freqIconBg = FREQUENCY_ICON_BG[ri.frequency] || FREQUENCY_ICON_BG.monthly
                const isToggling = togglingId === ri.id

                return (
                  <motion.div
                    key={ri.id}
                    variants={itemVariants}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  >
                    <Card className={cn(
                      'group hover:shadow-md transition-all duration-200 rounded-xl border-l-4 shadow-sm',
                      freqBorder,
                      ri.isActive ? 'hover:-translate-y-0.5' : 'opacity-75 hover:opacity-100'
                    )}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center size-10 rounded-xl bg-gradient-to-br ${freqIconBg} text-white shadow-sm shrink-0`}>
                              {ri.frequency === 'weekly' ? <Timer className="size-5" /> :
                               ri.frequency === 'monthly' ? <Calendar className="size-5" /> :
                               ri.frequency === 'quarterly' ? <Repeat className="size-5" /> :
                               <CalendarClock className="size-5" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{ri.templateName || 'Untitled'}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {ri.billToName || 'No customer'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className={cn('text-[10px] border', FREQUENCY_COLORS[ri.frequency] || FREQUENCY_COLORS.monthly)}>
                              {FREQUENCY_LABELS[ri.frequency] || ri.frequency}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(ri)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleGenerateNow(ri)}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Generate Now
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(ri)}>
                                  {ri.isActive ? (
                                    <>
                                      <Pause className="mr-2 h-4 w-4" />
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <Play className="mr-2 h-4 w-4" />
                                      Resume
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteId(ri.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Next date with countdown */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Next: {ri.nextDate ? format(new Date(ri.nextDate), 'dd MMM yyyy') : '-'}
                          </div>
                          {ri.isActive && daysUntilNext >= 0 && (
                            <div className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', countdownBg, countdownColor)}>
                              {daysUntilNext === 0 ? 'Today!' : daysUntilNext === 1 ? 'Tomorrow' : `${daysUntilNext}d away`}
                            </div>
                          )}
                        </div>

                        {/* Toggle switch with animation */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">
                            {getItemCount(ri.items)} item{getItemCount(ri.items) !== 1 ? 's' : ''} · {ri.currency}
                          </span>
                          <button
                            onClick={() => handleToggleActive(ri)}
                            disabled={isToggling}
                            className={cn(
                              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2',
                              ri.isActive
                                ? 'bg-emerald-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            )}
                          >
                            {isToggling ? (
                              <Loader2 className="size-3 animate-spin text-white absolute left-1/2 -translate-x-1/2" />
                            ) : (
                              <motion.span
                                className="inline-block size-4 rounded-full bg-white shadow-sm"
                                animate={{ x: ri.isActive ? 18 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            )}
                          </button>
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

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowAddDialog(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Template' : 'New Recurring Template'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the recurring invoice template' : 'Create a template to auto-generate invoices on a schedule'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={formTemplateName}
                onChange={(e) => setFormTemplateName(e.target.value)}
                placeholder="e.g. Monthly Retainer for Acme Corp"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={formFrequency} onValueChange={setFormFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Next Date</Label>
                <Input
                  type="date"
                  value={formNextDate}
                  onChange={(e) => setFormNextDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={formBillToName}
                  onChange={(e) => setFormBillToName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={formCurrency} onValueChange={setFormCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">₹ INR</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                    <SelectItem value="AED">د.إ AED</SelectItem>
                    <SelectItem value="SGD">S$ SGD</SelectItem>
                    <SelectItem value="AUD">A$ AUD</SelectItem>
                    <SelectItem value="CAD">C$ CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm() }}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {editingId ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the recurring invoice template. Any already generated invoices will remain.
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
    </motion.div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
