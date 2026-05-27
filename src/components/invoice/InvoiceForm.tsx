'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  CalendarIcon,
  Save,
  FileText,
  X,
  Loader2,
  RotateCcw,
  Palette,
  Building2,
  Landmark,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { format, addDays } from 'date-fns'

import { cn } from '@/lib/utils'
import { numberToWords } from '@/lib/numberToWords'
import { CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { useAppStore } from '@/stores/appStore'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { InvoiceTemplates, getStoredTemplate, setStoredTemplate, type TemplateName } from '@/components/invoice/InvoiceTemplates'

const TAX_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '12%', value: 12 },
  { label: '18%', value: 18 },
  { label: '28%', value: 28 },
  { label: 'Custom', value: -1 },
]

interface InvoiceItemForm {
  description: string
  quantity: number
  rate: number
  taxPercent: number
  amount: number
}

interface InvoiceFormValues {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  billToName: string
  billToPhone: string
  billToEmail: string
  billToAddress: string
  items: InvoiceItemForm[]
  receivedAmount: number
  previousBalance: number
  termsText: string
  currency: string
  discountText: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
}

const DRAFT_KEY = 'invoice-draft'

export default function InvoiceForm() {
  const {
    user,
    setCurrentView,
    setPreviewInvoiceId,
    editInvoiceId,
    setEditInvoiceId,
  } = useAppStore()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const [customTaxIndex, setCustomTaxIndex] = useState<number | null>(null)
  const [customTaxValues, setCustomTaxValues] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false)
  const [showRecurringDialog, setShowRecurringDialog] = useState(false)
  const [recurringTemplateName, setRecurringTemplateName] = useState('')
  const [recurringFrequency, setRecurringFrequency] = useState('monthly')
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Profile verification state
  const [profileLoading, setProfileLoading] = useState(true)
  const [isProfileSetup, setIsProfileSetup] = useState(true)

  useEffect(() => {
    if (user?.id) {
      setProfileLoading(true)
      fetch(`/api/profile?userId=${user.id}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data && data.businessProfile) {
            const bp = data.businessProfile
            // Check if business details are filled: companyName and companyAddress
            const hasBusinessDetails = !!(bp.companyName?.trim() && bp.companyAddress?.trim())
            // Check if bank details are filled: accountHolderName, bankName, accountNumber, and ifscCode
            const hasBankDetails = !!(bp.accountHolderName?.trim() && bp.bankName?.trim() && bp.accountNumber?.trim() && bp.ifscCode?.trim())
            
            if (!hasBusinessDetails || !hasBankDetails) {
              setIsProfileSetup(false)
            } else {
              setIsProfileSetup(true)
            }
          } else {
            setIsProfileSetup(false)
          }
        })
        .catch(() => {
          setIsProfileSetup(false)
        })
        .finally(() => {
          setProfileLoading(false)
        })
    } else {
      setProfileLoading(false)
    }
  }, [user?.id])

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName>(getStoredTemplate)
  const [showTemplates, setShowTemplates] = useState(false)

  // (AI Assistant removed — API not configured)

  const today = format(new Date(), 'yyyy-MM-dd')
  const defaultDueDate = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  const defaultItems: InvoiceItemForm[] = [
    { description: '', quantity: 1, rate: 0, taxPercent: 0, amount: 0 },
  ]

  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      invoiceNumber: '',
      invoiceDate: today,
      dueDate: defaultDueDate,
      billToName: '',
      billToPhone: '',
      billToEmail: '',
      billToAddress: '',
      items: defaultItems,
      receivedAmount: 0,
      previousBalance: 0,
      termsText: '',
      currency: 'INR',
      discountText: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const watchedItems = form.watch('items')
  const watchedReceivedAmount = form.watch('receivedAmount')
  const watchedPreviousBalance = form.watch('previousBalance')
  const watchedCurrency = form.watch('currency') || 'INR'
  const watchedDiscountText = form.watch('discountText') || ''
  const currencySymbol = getCurrencySymbol(watchedCurrency)

  // Calculate totals — always coerce to Number() to prevent NaN from string inputs
  const subtotal = watchedItems.reduce((sum, item) => {
    const base = (Number(item.quantity) || 0) * (Number(item.rate) || 0)
    return sum + base
  }, 0)

  const taxTotal = watchedItems.reduce((sum, item) => {
    const base = (Number(item.quantity) || 0) * (Number(item.rate) || 0)
    const taxAmount = (base * (Number(item.taxPercent) || 0)) / 100
    return sum + taxAmount
  }, 0)

  const preDiscountTotal = subtotal + taxTotal
  let discountTotal = 0
  if (watchedDiscountText.trim()) {
    if (watchedDiscountText.includes('%')) {
      const percentage = parseFloat(watchedDiscountText.replace(/[^0-9.]/g, '')) || 0
      discountTotal = (preDiscountTotal * percentage) / 100
    } else {
      discountTotal = parseFloat(watchedDiscountText.replace(/[^0-9.]/g, '')) || 0
    }
  }

  const grandTotal = Math.max(0, preDiscountTotal - discountTotal)
  const currentBalance = grandTotal - (Number(watchedReceivedAmount) || 0) + (Number(watchedPreviousBalance) || 0)
  const amountInWords = numberToWords(grandTotal, watchedCurrency)

  // Amounts are computed inline from watched values — no useEffect needed

  // Fetch customers for autocomplete
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/customers?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.customers) setCustomers(data.customers)
        })
        .catch(() => {})
    }
  }, [user?.id])

  // Load invoice for editing
  useEffect(() => {
    if (editInvoiceId && user?.id) {
      setIsLoadingInvoice(true)
      fetch(`/api/invoices?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          const invoice = data.invoices?.find((inv: { id: string }) => inv.id === editInvoiceId)
          if (invoice) {
            form.reset({
              invoiceNumber: invoice.invoiceNumber,
              invoiceDate: invoice.invoiceDate,
              dueDate: invoice.dueDate,
              billToName: invoice.billToName || '',
              billToPhone: invoice.billToPhone || '',
              billToEmail: invoice.billToEmail || '',
              billToAddress: invoice.billToAddress || '',
              items: invoice.items?.length > 0
                ? invoice.items.map((item: { description: string; quantity: number; rate: number; taxPercent: number; amount: number }) => ({
                    description: item.description || '',
                    quantity: item.quantity || 1,
                    rate: item.rate || 0,
                    taxPercent: item.taxPercent || 0,
                    amount: item.amount || 0,
                  }))
                : defaultItems,
              receivedAmount: invoice.receivedAmount || 0,
              previousBalance: invoice.previousBalance || 0,
              termsText: invoice.termsText || '',
              currency: invoice.currency || 'INR',
              discountText: invoice.discountText || '',
            })
          }
        })
        .catch(() => toast.error('Failed to load invoice'))
        .finally(() => setIsLoadingInvoice(false))
    }
  }, [editInvoiceId, user?.id])

  // Auto-generate invoice number using user settings format
  useEffect(() => {
    if (!editInvoiceId && user?.id && !form.getValues('invoiceNumber')) {
      fetch(`/api/invoices?userId=${user.id}&nextNumber=true`)
        .then(res => res.json())
        .then(data => {
          if (data.nextInvoiceNumber) {
            form.setValue('invoiceNumber', data.nextInvoiceNumber)
          } else {
            const year = new Date().getFullYear()
            form.setValue('invoiceNumber', `INV-${year}-001`)
          }
        })
        .catch(() => {
          const year = new Date().getFullYear()
          form.setValue('invoiceNumber', `INV-${year}-001`)
        })
    }
  }, [user?.id, editInvoiceId, form])

  // Pre-fill defaults from user settings
  useEffect(() => {
    if (!editInvoiceId && user) {
      const taxRate = parseFloat(user.defaultTaxRate || '18')
      const dueDays = parseInt(user.defaultDueDays || '30', 10)
      
      // Update form default due date if it wasn't modified
      const currentDueDate = form.getValues('dueDate')
      const expectedOldDefault = format(addDays(new Date(), 7), 'yyyy-MM-dd')
      if (currentDueDate === expectedOldDefault || !currentDueDate) {
        form.setValue('dueDate', format(addDays(new Date(), isNaN(dueDays) ? 30 : dueDays), 'yyyy-MM-dd'))
      }
      
      // Set taxPercent for the first item if it is empty/unconfigured
      const items = form.getValues('items')
      if (items.length === 1 && items[0].description === '' && items[0].rate === 0 && items[0].taxPercent === 0) {
        form.setValue('items.0.taxPercent', isNaN(taxRate) ? 18 : taxRate)
      }
    }
  }, [user, editInvoiceId, form])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      const values = form.getValues()
      if (values.items.some(i => i.description || i.rate > 0) || values.billToName) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
      }
    }, 30000)

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
    }
  }, [])

  // Draft loading disabled — was resetting form with stale data causing input issues
  // useEffect(() => {
  //   if (!editInvoiceId) {
  //     const saved = localStorage.getItem(DRAFT_KEY)
  //     if (saved) { try { form.reset(JSON.parse(saved)) } catch {} }
  //   }
  // }, [])

  const selectCustomer = (customer: Customer) => {
    form.setValue('billToName', customer.name)
    form.setValue('billToPhone', customer.phone)
    form.setValue('billToEmail', customer.email)
    form.setValue('billToAddress', customer.address)
    setShowCustomerSuggestions(false)
  }

  const handleTaxChange = (index: number, value: string) => {
    const numValue = parseFloat(value)
    if (numValue === -1) {
      setCustomTaxIndex(index)
      setCustomTaxValues(prev => ({ ...prev, [index]: '' }))
    } else {
      form.setValue(`items.${index}.taxPercent`, numValue)
      if (customTaxIndex === index) setCustomTaxIndex(null)
    }
  }

  const handleCustomTaxInput = (index: number, value: string) => {
    setCustomTaxValues(prev => ({ ...prev, [index]: value }))
    const numVal = parseFloat(value)
    if (!isNaN(numVal) && numVal >= 0) {
      form.setValue(`items.${index}.taxPercent`, numVal)
    }
  }

  const addItem = () => {
    append({ description: '', quantity: 1, rate: 0, taxPercent: 0, amount: 0 })
  }

  const onSubmit = async (status: string = 'sent') => {
    if (!user?.id) {
      toast.error('Please login first')
      return
    }

    setIsSubmitting(true)
    try {
      const formValues = form.getValues()
      const computedItems = watchedItems.map(item => {
        const q = Number(item.quantity) || 0
        const r = Number(item.rate) || 0
        const t = Number(item.taxPercent) || 0
        const base = q * r
        const taxAmt = base * (t / 100)
        return {
          description: item.description || '',
          quantity: q,
          rate: r,
          taxPercent: t,
          amount: Math.round((base + taxAmt) * 100) / 100,
        }
      })

      const payload = {
        invoiceNumber: formValues.invoiceNumber,
        invoiceDate: formValues.invoiceDate,
        dueDate: formValues.dueDate,
        billToName: formValues.billToName || '',
        billToPhone: formValues.billToPhone || '',
        billToEmail: formValues.billToEmail || '',
        billToAddress: formValues.billToAddress || '',
        termsText: formValues.termsText || '',
        currency: formValues.currency || 'INR',
        receivedAmount: Number(formValues.receivedAmount) || 0,
        previousBalance: Number(formValues.previousBalance) || 0,
        userId: user.id,
        subtotal,
        taxTotal,
        discountText: formValues.discountText || '',
        discountTotal,
        grandTotal,
        currentBalance,
        amountInWords,
        status,
        items: computedItems,
      }

      let response: Response
      if (editInvoiceId) {
        response = await fetch('/api/invoices/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editInvoiceId, ...payload }),
        })
      } else {
        response = await fetch('/api/invoices/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save invoice')
      }

      localStorage.removeItem(DRAFT_KEY)

      if (status === 'draft') {
        toast.success('Draft saved successfully')
        setCurrentView('invoices')
      } else {
        toast.success('Invoice generated successfully!')
        setPreviewInvoiceId(result.invoice.id)
        setEditInvoiceId(null)
        setCurrentView('preview-invoice')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save invoice')
    } finally {
      setIsSubmitting(false)
    }
  }



  if (profileLoading || isLoadingInvoice) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground text-sm">Verifying profile setup...</p>
        </div>
      </div>
    )
  }

  if (!isProfileSetup) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto my-12"
      >
        <Card className="border-border/50 shadow-2xl relative overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl">
          {/* Top warning line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
          
          <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Complete Profile Setup</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Firstly setup your profile business details and bank details. After that only you can create invoices.
              </p>
            </div>

            {/* Checklist */}
            <div className="rounded-xl bg-muted/50 p-4 text-left space-y-3 border border-border/30">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground">Business Details (Company Name, Address)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Landmark className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground">Bank Details (Account Name, Bank, A/C No, IFSC)</span>
              </div>
            </div>

            <Button
              onClick={() => setCurrentView('profile')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-md shadow-emerald-500/10 group h-11"
            >
              <span>Go to Profile Setup</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto p-4 md:p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {editInvoiceId ? 'Edit Invoice' : 'Create Invoice'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {editInvoiceId ? 'Update invoice details' : 'Fill in the details to generate a new invoice'}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Auto-saved
        </Badge>
      </div>

      <form className="space-y-6 animate-fade-in">
        {/* Gradient section divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-300 dark:via-emerald-700 to-transparent" />

        {/* SECTION 1 - Invoice Details */}
        <Card className="border-border/50 shadow-sm card-shine">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  {...form.register('invoiceNumber')}
                  placeholder="INV-2026-001"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceTemplate">Template</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedTemplate}
                    onValueChange={(val) => {
                      setSelectedTemplate(val as TemplateName)
                      setStoredTemplate(val as TemplateName)
                    }}
                  >
                    <SelectTrigger id="invoiceTemplate" className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Classic
                        </span>
                      </SelectItem>
                      <SelectItem value="modern">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-teal-500" />
                          Modern
                        </span>
                      </SelectItem>
                      <SelectItem value="creative">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          Creative
                        </span>
                      </SelectItem>
                      <SelectItem value="professional">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-gray-500" />
                          Professional
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0 border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                    onClick={() => setShowTemplates(true)}
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={watchedCurrency}
                  onValueChange={(val) => form.setValue('currency', val)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !form.watch('invoiceDate') && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('invoiceDate')
                        ? format(new Date(form.watch('invoiceDate')), 'dd MMM yyyy')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch('invoiceDate') ? new Date(form.watch('invoiceDate')) : new Date()}
                      onSelect={(date) => {
                        if (date) form.setValue('invoiceDate', format(date, 'yyyy-MM-dd'))
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !form.watch('dueDate') && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('dueDate')
                        ? format(new Date(form.watch('dueDate')), 'dd MMM yyyy')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch('dueDate') ? new Date(form.watch('dueDate')) : addDays(new Date(), 7)}
                      onSelect={(date) => {
                        if (date) form.setValue('dueDate', format(date, 'yyyy-MM-dd'))
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>




        {/* SECTION 2 - Bill To */}
        <Card className="border-border/50 shadow-sm card-shine">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Bill To
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="billToName">Customer Name</Label>
                <Input
                  id="billToName"
                  {...form.register('billToName')}
                  placeholder="Enter customer name"
                  onFocus={() => setShowCustomerSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                />
                <AnimatePresence>
                  {showCustomerSuggestions && customers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 top-full left-0 right-0 mt-1"
                    >
                      <div className="bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {customers
                          .filter(c =>
                            c.name.toLowerCase().includes((form.watch('billToName') || '').toLowerCase())
                          )
                          .map(customer => (
                            <button
                              key={customer.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-accent text-sm transition-colors"
                              onMouseDown={() => selectCustomer(customer)}
                            >
                              <div className="font-medium">{customer.name}</div>
                              {customer.email && (
                                <div className="text-xs text-muted-foreground">{customer.email}</div>
                              )}
                            </button>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billToAddress">Address</Label>
                <Input
                  id="billToAddress"
                  {...form.register('billToAddress')}
                  placeholder="Enter address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gradient section divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-300 dark:via-emerald-700 to-transparent" />

        {/* SECTION 3 - Item Table */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
                <path d="M9 3v18" />
              </svg>
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground w-[40%]">Description</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground w-[12%]">Qty</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground w-[15%]">Rate</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground w-[15%]">Tax(%)</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground w-[15%]">Amount</th>
                    <th className="w-[3%]"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const item = watchedItems[index]
                    return (
                      <tr
                        key={field.id}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2 px-2">
                          <Input
                            id={`item-desc-${index}`}
                            type="text"
                            value={watchedItems[index]?.description ?? ''}
                            onChange={(e) => {
                              form.setValue(`items.${index}.description`, e.target.value, { shouldDirty: true })
                            }}
                            placeholder="Item description"
                            className="border-0 shadow-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 px-1 h-9"
                            autoComplete="off"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            id={`item-qty-${index}`}
                            type="text"
                            inputMode="numeric"
                            value={watchedItems[index]?.quantity ?? ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '')
                              form.setValue(`items.${index}.quantity`, val === '' ? 0 : parseFloat(val) || 0, { shouldDirty: true })
                            }}
                            placeholder="1"
                            className="text-center border-0 shadow-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 px-1 h-9"
                            autoComplete="off"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            id={`item-rate-${index}`}
                            type="text"
                            inputMode="decimal"
                            value={watchedItems[index]?.rate ?? ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '')
                              form.setValue(`items.${index}.rate`, val === '' ? 0 : parseFloat(val) || 0, { shouldDirty: true })
                            }}
                            placeholder="0"
                            className="text-center border-0 shadow-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 px-1 h-9"
                            autoComplete="off"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1 justify-center">
                            <Select
                              value={
                                customTaxIndex === index
                                  ? '-1'
                                  : TAX_OPTIONS.find(t => t.value === item?.taxPercent)?.value?.toString() ?? '0'
                              }
                              onValueChange={(val) => handleTaxChange(index, val)}
                            >
                              <SelectTrigger className="w-20 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TAX_OPTIONS.map(option => (
                                  <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {customTaxIndex === index && (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={customTaxValues[index] ?? ''}
                                onChange={(e) => handleCustomTaxInput(index, e.target.value)}
                                className="w-16 h-8 text-xs text-center"
                                placeholder="%"
                                autoFocus
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right font-medium text-sm">
                          {((() => { const q = Number(watchedItems[index]?.quantity) || 0; const r = Number(watchedItems[index]?.rate) || 0; const t = Number(watchedItems[index]?.taxPercent) || 0; const b = q * r; return b + b * t / 100 })()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-1">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {fields.map((field, index) => {
                const item = watchedItems[index]
                return (
                  <div
                    key={field.id}
                    className="border border-border/50 rounded-lg p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <Input
                      id={`mobile-item-desc-${index}`}
                      type="text"
                      value={watchedItems[index]?.description ?? ''}
                      onChange={(e) => {
                        form.setValue(`items.${index}.description`, e.target.value, { shouldDirty: true })
                      }}
                      placeholder="Item description"
                      autoComplete="off"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          id={`mobile-item-qty-${index}`}
                          type="text"
                          inputMode="numeric"
                          value={watchedItems[index]?.quantity ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '')
                            form.setValue(`items.${index}.quantity`, val === '' ? 0 : parseFloat(val) || 0, { shouldDirty: true })
                          }}
                          placeholder="1"
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Rate</Label>
                        <Input
                          id={`mobile-item-rate-${index}`}
                          type="text"
                          inputMode="decimal"
                          value={watchedItems[index]?.rate ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '')
                            form.setValue(`items.${index}.rate`, val === '' ? 0 : parseFloat(val) || 0, { shouldDirty: true })
                          }}
                          placeholder="0"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Tax</Label>
                        <Select
                          value={
                            customTaxIndex === index
                              ? '-1'
                              : TAX_OPTIONS.find(t => t.value === item?.taxPercent)?.value?.toString() ?? '0'
                          }
                          onValueChange={(val) => handleTaxChange(index, val)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {customTaxIndex === index && (
                        <div className="w-20 mt-5">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customTaxValues[index] ?? ''}
                            onChange={(e) => handleCustomTaxInput(index, e.target.value)}
                            placeholder="%"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-right font-medium">
                      Amount: {currencySymbol}{((() => { const q = Number(watchedItems[index]?.quantity) || 0; const r = Number(watchedItems[index]?.rate) || 0; const t = Number(watchedItems[index]?.taxPercent) || 0; const b = q * r; return b + b * t / 100 })()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="mt-4 w-full border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-400 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardContent>
        </Card>

        {/* SECTION 4 - Totals */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Totals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md ml-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{currencySymbol}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax Total</span>
                <span className="font-medium">{currencySymbol}{taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-sm text-rose-600 dark:text-rose-400">
                  <span className="text-muted-foreground">Discount ({watchedDiscountText})</span>
                  <span className="font-medium">-{currencySymbol}{discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {currencySymbol}{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm">
                <Label htmlFor="discountText" className="text-muted-foreground cursor-pointer">Discount (e.g. 10% or 500)</Label>
                <Input
                  id="discountText"
                  type="text"
                  {...form.register('discountText')}
                  placeholder="0"
                  className="w-36 text-right h-8"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <Label htmlFor="receivedAmount" className="text-muted-foreground cursor-pointer">Received Amount</Label>
                <Input
                  id="receivedAmount"
                  type="number"
                  step="0.01"
                  {...form.register('receivedAmount', { valueAsNumber: true })}
                  className="w-36 text-right h-8"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <Label htmlFor="previousBalance" className="text-muted-foreground cursor-pointer">Previous Balance</Label>
                <Input
                  id="previousBalance"
                  type="number"
                  step="0.01"
                  {...form.register('previousBalance', { valueAsNumber: true })}
                  className="w-36 text-right h-8"
                />
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Current Balance</span>
                <span className={cn(
                  currentBalance > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                )}>
                  {currencySymbol}{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-muted/50 rounded-md p-3 mt-2">
                <p className="text-xs text-muted-foreground mb-1">Amount in Words</p>
                <p className="text-sm font-medium">{amountInWords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 5 - Terms */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Terms & Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...form.register('termsText')}
              placeholder="Enter terms and conditions..."
              rows={4}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEditInvoiceId(null)
              setCurrentView('invoices')
            }}
            className="sm:order-1"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRecurringTemplateName('')
              setRecurringFrequency('monthly')
              setShowRecurringDialog(true)
            }}
            disabled={isSubmitting}
            className="sm:order-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Save as Recurring
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onSubmit('draft')}
            disabled={isSubmitting}
            className="sm:order-3"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save as Draft
          </Button>
          <Button
            type="button"
            className="sm:order-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onSubmit('sent')}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Generate Invoice
          </Button>
        </div>
      </form>

      {/* Save as Recurring Dialog */}
      <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Recurring Invoice</DialogTitle>
            <DialogDescription>
              Save this invoice as a template to auto-generate on a schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={recurringTemplateName}
                onChange={(e) => setRecurringTemplateName(e.target.value)}
                placeholder="e.g. Monthly Retainer for Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecurringDialog(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!user?.id) return
                const values = form.getValues()
                try {
                  const res = await fetch('/api/invoices/recurring', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: user.id,
                      templateName: recurringTemplateName || `Recurring - ${values.billToName || 'Invoice'}`,
                      frequency: recurringFrequency,
                      nextDate: values.invoiceDate,
                      billToName: values.billToName,
                      billToPhone: values.billToPhone,
                      billToEmail: values.billToEmail,
                      billToAddress: values.billToAddress,
                      currency: values.currency || 'INR',
                      items: values.items,
                      termsText: values.termsText,
                    }),
                  })
                  if (res.ok) {
                    toast.success('Recurring invoice template saved!')
                    setShowRecurringDialog(false)
                  } else {
                    toast.error('Failed to save recurring template')
                  }
                } catch {
                  toast.error('Failed to save recurring template')
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Templates Dialog */}
      <InvoiceTemplates
        open={showTemplates}
        onOpenChange={setShowTemplates}
        currentTemplate={selectedTemplate}
        onTemplateChange={(template) => setSelectedTemplate(template)}
      />
    </motion.div>
  )
}
