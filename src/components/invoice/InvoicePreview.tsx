'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  Printer,
  Share2,
  ArrowLeft,
  Pencil,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Send,
  Check,
} from 'lucide-react'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import { getCurrencySymbol } from '@/lib/currency'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  discountText?: string
  discountTotal?: number
  grandTotal: number
  receivedAmount: number
  previousBalance: number
  currentBalance: number
  amountInWords: string
  termsText: string
  currency: string
  items: InvoiceItem[]
}

interface BusinessProfile {
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  companyWebsite: string
  gstNumber: string
  panNumber: string
  companyLogo: string
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  branchName: string
  qrCode: string
  signatureImage: string
  sealImage: string
  sealCompanyName: string
  useSeal: boolean
}

export default function InvoicePreview() {
  const { user, previewInvoiceId, setCurrentView, setEditInvoiceId, setPreviewInvoiceId } = useAppStore()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [notFoundId, setNotFoundId] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        if (containerWidth < 794) {
          setScale(containerWidth / 794)
        } else {
          setScale(1)
        }
      }
    }
    
    const timer = setTimeout(updateScale, 150)
    window.addEventListener('resize', updateScale)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateScale)
    }
  }, [invoice])

  // Email share state
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

  // Derive states: notFound is specific to the current previewInvoiceId
  const notFound = notFoundId === previewInvoiceId
  const loading = !!previewInvoiceId && !!user?.id && invoice?.id !== previewInvoiceId && !notFound

  useEffect(() => {
    if (!user?.id || !previewInvoiceId) {
      if (!previewInvoiceId && user?.id) {
        fetch(`/api/profile?userId=${user.id}`)
          .then(r => r.json())
          .then(profileData => {
            if (profileData.businessProfile) {
              setBusinessProfile(profileData.businessProfile)
            }
          })
          .catch(() => { })
      }
      return
    }

    // Skip if we already have this invoice loaded
    if (invoice?.id === previewInvoiceId) return

    let cancelled = false

    Promise.all([
      fetch(`/api/invoices/detail?id=${previewInvoiceId}&userId=${user.id}`).then(r => {
        if (!r.ok) throw new Error('Invoice not found')
        return r.json()
      }),
      fetch(`/api/profile?userId=${user.id}`).then(r => r.json()),
    ])
      .then(([invoiceData, profileData]) => {
        if (cancelled) return
        if (invoiceData.invoice) {
          setInvoice(invoiceData.invoice)
          setNotFoundId(null)
        } else {
          setNotFoundId(previewInvoiceId)
        }
        if (profileData.businessProfile) {
          setBusinessProfile(profileData.businessProfile)
        }
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Failed to load invoice data')
        setNotFoundId(previewInvoiceId)
      })

    return () => { cancelled = true }
  }, [user?.id, previewInvoiceId, invoice?.id])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice?.invoiceNumber}`,
          text: `Invoice ${invoice?.invoiceNumber} for ${invoice?.billToName}`,
        })
      } catch {
        // User cancelled share
      }
    } else {
      toast.info('Share not supported in this browser')
    }
  }

  const handleEdit = () => {
    if (invoice) {
      setEditInvoiceId(invoice.id)
      setPreviewInvoiceId(null)
      setCurrentView('create-invoice')
    }
  }

  const handleOpenEmailDialog = () => {
    if (invoice) {
      setShareEmail(invoice.billToEmail || '')
      setShareMessage('')
      setShareSuccess(false)
      setShowEmailDialog(true)
    }
  }

  const handleSendEmail = async () => {
    if (!invoice || !user?.id || !shareEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setShareLoading(true)
    try {
      const response = await fetch('/api/invoices/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          userId: user.id,
          email: shareEmail.trim(),
          message: shareMessage.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share invoice')
      }

      setShareSuccess(true)
      toast.success(`Invoice ${invoice.invoiceNumber} shared with ${shareEmail}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to share invoice')
    } finally {
      setShareLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button variant="outline" onClick={() => setCurrentView('invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>
    )
  }

  // Use business profile with robust fallbacks so empty database values don't clear the branding
  const company: BusinessProfile = {
    companyName: businessProfile?.companyName || user?.name || 'Sadbhawana Publication',
    companyAddress: businessProfile?.companyAddress || 'Near Rajeev Gandhi School Ambah, Vallabh Colony Ambah, Morena (M.P.)',
    companyPhone: businessProfile?.companyPhone || user?.phone || '+91 7987484155',
    companyEmail: businessProfile?.companyEmail || user?.email || 'sadbhawanapublication@gmail.com',
    companyWebsite: businessProfile?.companyWebsite || '',
    gstNumber: businessProfile?.gstNumber || 'GTZPS4321G',
    panNumber: businessProfile?.panNumber || 'GTZPS4321G',
    companyLogo: businessProfile?.companyLogo || '/logo.png',
    accountHolderName: businessProfile?.accountHolderName || 'Sadbhawana Publication',
    bankName: businessProfile?.bankName || 'Punjab National Bank (PNB), Ambah',
    accountNumber: businessProfile?.accountNumber || '0512102100000903',
    ifscCode: businessProfile?.ifscCode || 'PUNB0051210',
    branchName: businessProfile?.branchName || 'Ambah',
    qrCode: businessProfile?.qrCode || '',
    signatureImage: businessProfile?.signatureImage || '',
    sealImage: businessProfile?.sealImage || '',
    sealCompanyName: businessProfile?.sealCompanyName || 'Sadbhawana Publication',
    useSeal: businessProfile?.useSeal || false,
  }

  const displayName = company.companyName

  // Generate UPI QR code data matching the bank account or default
  const upiId = company.ifscCode ? `${company.accountNumber}@${company.bankName.toLowerCase().includes('pnb') ? 'pnb' : 'ybl'}` : 'sadbhawanapublication@pnb'
  const qrCodeSrc = company.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(displayName)}&am=${invoice.grandTotal}&cu=INR`)}`

  // Get currency symbol
  const cs = getCurrencySymbol(invoice.currency || 'INR')

  const statusColorMap: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    sent: 'bg-blue-50 text-blue-700 border-blue-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in"
    >
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Reset browser body and html */
          html, body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Completely hide print-hidden elements */
          .print\:hidden,
          [class*="print:hidden"],
          aside,
          nav,
          header,
          button,
          .no-print {
            display: none !important;
          }

          /* Reset all parent wrappers to prevent margins, paddings, and shifting */
          #__next,
          div[class*="min-h-screen"],
          div.lg\:ml-64,
          main,
          main.flex-1,
          div.animate-fade-in,
          .max-w-4xl {
            margin: 0 !important;
            padding: 0 !important;
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            height: 100% !important;
            display: block !important;
            transform: none !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }

          /* Force exact A4 dimensions and margins */
          @page {
            size: A4;
            margin: 0.15in 10mm 0.15in 10mm !important;
          }

          /* Main invoice bordered container */
          .print-single-page {
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
            max-height: 100% !important;
            padding: 24px !important; /* Beautiful inside padding */
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important; /* Perfect elegant border */
            border-radius: 16px !important; /* rounded corners */
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
            background-color: white !important;
          }

          /* Reset absolute containers padding */
          .print-single-page .p-8,
          .print-single-page .p-10 {
            padding: 0 !important;
          }

          /* Table Styling */
          .print-single-page table th {
            padding-top: 6px !important;
            padding-bottom: 6px !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
            font-size: 11px !important;
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-single-page table td {
            padding-top: 5px !important;
            padding-bottom: 5px !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
            font-size: 11px !important;
          }

          /* Specific class-based sizes to prevent generic Tailwind conflicts */
          .company-logo-container {
            width: 56px !important;
            height: 56px !important;
          }
          .print-qr-code {
            width: 88px !important;
            height: 88px !important;
            padding: 8px !important;
          }
          .print-signature {
            height: 48px !important;
          }

          /* Proportional typographical scaling for premium visual weights */
          .print-single-page h1 {
            font-size: 18px !important;
          }
          .print-single-page .text-base {
            font-size: 13px !important;
          }
          .print-single-page .text-sm {
            font-size: 11px !important;
          }
          .print-single-page .text-xs {
            font-size: 10px !important;
          }
          .print-single-page .text-[11px] {
            font-size: 9px !important;
          }
          .print-single-page .text-[10px] {
            font-size: 9px !important;
          }

          /* Compress vertical spacing safely to avoid page break */
          .print-single-page .space-y-6 > * + * {
            margin-top: 10px !important;
          }
          .print-single-page .space-y-4 > * + * {
            margin-top: 6px !important;
          }
          .print-single-page .mt-4 {
            margin-top: 6px !important;
          }
          .print-single-page .mt-2 {
            margin-top: 2px !important;
          }
          .print-single-page .pt-6 {
            padding-top: 8px !important;
          }
          .print-single-page .p-5 {
            padding: 10px !important;
          }
          .print-single-page .p-4 {
            padding: 8px !important;
          }
        }
      `}} />

      {/* Action Buttons - hidden on print */}
      <div className="print:hidden flex flex-wrap items-center gap-2 justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            setPreviewInvoiceId(null)
            setCurrentView('invoices')
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
            onClick={handleOpenEmailDialog}
          >
            <Mail className="mr-2 h-4 w-4" />
            Share via Email
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleDownloadPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document - always white/light for printing */}
      <div 
        ref={containerRef} 
        className="w-full flex justify-center overflow-hidden print:overflow-visible print:h-auto"
        style={{ height: scale < 1 ? `${1122 * scale}px` : 'auto' }}
      >
        <div
          ref={printRef}
          style={scale < 1 ? {
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width: '794px',
            height: '1122px',
          } : undefined}
          className="bg-white text-gray-900 shadow-xl border border-gray-200 w-full max-w-[21cm] min-h-[29.7cm] print:min-h-0 print-single-page flex flex-col justify-between shrink-0 print:transform-none print:w-full print:h-full"
        >
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            {/* Header line */}
            <div className="flex justify-between items-center text-xs tracking-wider text-gray-500 font-normal">
              <span>BILL OF SUPPLY</span>
              <span className="border border-orange-400 text-orange-500 text-[10px] font-normal px-2 py-0.5 rounded tracking-wide">
                ORIGINAL FOR RECIPIENT
              </span>
            </div>

            {/* Brand Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-gray-200 bg-white company-logo-container">
                {company.companyLogo ? (
                  <img
                    src={company.companyLogo}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 tracking-wide uppercase">
                  {displayName}
                </h1>
                {company.companyAddress && (
                  <p className="text-xs text-gray-500 mt-0.5 font-normal leading-relaxed">
                    {company.companyAddress}
                  </p>
                )}
                <div className="text-xs text-gray-500 mt-1 font-normal flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  {company.companyPhone && <span>Mobile: {company.companyPhone}</span>}
                  {company.companyPhone && (company.companyEmail || company.gstNumber || company.panNumber) && <span className="text-gray-300">|</span>}
                  {company.companyEmail && <span>Email: {company.companyEmail}</span>}
                  {company.companyEmail && (company.gstNumber || company.panNumber) && <span className="text-gray-300">|</span>}
                  {(company.gstNumber || company.panNumber) && (
                    <span>PAN/GST: {Array.from(new Set([company.panNumber, company.gstNumber].filter(Boolean))).join(' / ')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Thick divider */}
            <div className="h-[1.5px] bg-black w-full" />

            {/* Invoice Info Row */}
            <div className="flex justify-between items-center py-1 px-1 text-sm">
              <div className="flex items-center">
                <span className="text-gray-500 font-normal mr-2">Invoice No.</span>
                <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 font-normal mr-2">Invoice Date</span>
                <span className="font-semibold text-gray-900">
                  {invoice.invoiceDate ? (invoice.invoiceDate.includes('/') ? invoice.invoiceDate : format(new Date(invoice.invoiceDate), 'dd/MM/yyyy')) : '-'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 font-normal mr-2">Due Date</span>
                <span className="font-semibold text-gray-900">
                  {invoice.dueDate ? (invoice.dueDate.includes('/') ? invoice.dueDate : format(new Date(invoice.dueDate), 'dd/MM/yyyy')) : '-'}
                </span>
              </div>
            </div>

            {/* Bill To */}
            <div className="px-1 space-y-0.5 mt-1.5">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-normal">BILL TO</p>
              <p className="text-base font-semibold text-gray-900">{invoice.billToName || 'Customer'}</p>
              {invoice.billToAddress && (
                <p className="text-sm text-gray-600 leading-relaxed max-w-md">{invoice.billToAddress}</p>
              )}
            </div>

            {/* Items Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-250">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 uppercase w-[50%]">ITEMS</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700 uppercase">QTY.</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700 uppercase">RATE</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700 uppercase">TAX(%)</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700 uppercase">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-150 last:border-0 bg-white">
                      <td className="py-2 px-3 text-gray-950 font-normal">{item.description || '-'}</td>
                      <td className="py-2 px-3 text-right text-gray-700 font-normal">{item.quantity}</td>
                      <td className="py-2 px-3 text-right text-gray-700 font-normal">
                        {cs}{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700 font-normal">{item.taxPercent}%</td>
                      <td className="py-2 px-3 text-right font-normal text-gray-950">
                        {cs}{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal & Tax Section */}
            <div className="flex flex-col items-end px-1 mt-1 space-y-0.5">
              <div className="flex justify-between w-64 text-sm font-normal text-gray-500">
                <span>SUBTOTAL</span>
                <span className="text-gray-950 font-normal">{cs}{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {invoice.taxTotal > 0 && (
                <div className="flex justify-between w-64 text-sm font-normal text-gray-500">
                  <span>TAX</span>
                  <span className="text-gray-950 font-normal">+{cs}{invoice.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {invoice.discountTotal && invoice.discountTotal > 0 && (
                <div className="flex justify-between w-64 text-sm font-normal text-rose-600">
                  <span>DISCOUNT ({invoice.discountText})</span>
                  <span className="text-rose-600 font-normal">-{cs}{invoice.discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            {/* Summary Box */}
            <div className="mt-2">
              <div className="w-full border border-gray-200 rounded-lg p-3 space-y-1.5 bg-white">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal + Tax</span>
                  <span className="font-normal text-gray-900">
                    {cs}{(invoice.subtotal + invoice.taxTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {invoice.discountTotal && invoice.discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-rose-600 border-t border-gray-100 pt-1">
                    <span>Discount ({invoice.discountText})</span>
                    <span className="font-normal text-rose-600">
                      -{cs}{invoice.discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-1">
                  <span>Total Amount</span>
                  <span className="font-normal text-gray-900">
                    {cs}{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-1">
                  <span>Received Amount</span>
                  <span className="font-normal text-gray-900">
                    {cs}{invoice.receivedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-1">
                  <span>Previous Balance</span>
                  <span className="font-normal text-gray-900">
                    {cs}{invoice.previousBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-1.5 font-semibold text-gray-950">
                  <span className="font-semibold text-gray-950">Current Balance</span>
                  <span className="text-sm font-semibold text-gray-950">
                    {cs}{invoice.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-normal">Total Amount (in words)</p>
                  <p className="text-xs font-normal text-gray-950 mt-0.5">{invoice.amountInWords || '-'}</p>
                </div>
              </div>
            </div>

            {/* Bank Details & Terms Box */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3 text-sm bg-white mt-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-900 font-semibold mb-1">BANK DETAILS</p>
                <div className="space-y-0.5 text-gray-700">
                  <p><span className="font-normal text-gray-500">Name:</span> {company.accountHolderName || displayName}</p>
                  <p><span className="font-normal text-gray-500">Account No:</span> {company.accountNumber || '0512102100000903'}</p>
                  <p><span className="font-normal text-gray-500">IFSC Code:</span> {company.ifscCode || 'PUNB0051210'}</p>
                  <p><span className="font-normal text-gray-500">Bank:</span> {company.bankName || 'Punjab National Bank (PNB), Ambah'}</p>
                </div>
              </div>
              <div className="border-t border-gray-150 pt-2">
                <p className="text-xs uppercase tracking-wider text-gray-900 font-semibold mb-1">TERMS AND CONDITIONS</p>
                <div className="space-y-0.5 text-xs text-gray-500">
                  {invoice.termsText ? (
                    invoice.termsText.split('\n').filter(Boolean).map((line, index) => (
                      <p key={index} className="leading-relaxed">
                        {line.match(/^\d+\./) ? line : `${index + 1}. ${line}`}
                      </p>
                    ))
                  ) : (
                    <>
                      <p>1. Goods once sold will not be taken back or exchanged</p>
                      <p>2. All disputes are subject to local jurisdiction only</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer Section */}
          <div className="flex items-end justify-between pt-4 mt-auto">
            {/* QR Code section */}
            <div className="text-center flex flex-col items-center">
              <div className="border border-gray-250 rounded-xl p-3 bg-white shadow-sm shrink-0 print-qr-code">
                <img
                  src={qrCodeSrc}
                  alt="UPI QR Code"
                  className="w-28 h-28 object-contain print:w-full print:h-full"
                />
              </div>
              <span className="text-[11px] font-normal text-gray-500 mt-1.5 tracking-wide uppercase">Scan for Paying Amount</span>
            </div>

            {/* Signature Section */}
            <div className="text-center min-w-[200px]">
              {company.signatureImage ? (
                <div className="mb-1.5 h-14 flex items-end justify-center print-signature">
                  <img
                    src={company.signatureImage}
                    alt="Authorized Signature"
                    className="max-h-14 object-contain print:max-h-12"
                  />
                </div>
              ) : (
                <div className="border-b border-gray-300 w-full mb-2 h-14 flex items-end justify-center">
                  <span className="text-xs text-gray-400 italic mb-0.5">Signature</span>
                </div>
              )}
              <div className="text-xs tracking-wider text-gray-500 font-normal uppercase">
                AUTHORIZED SIGNATORY FOR
              </div>
              <div className="text-sm font-normal text-gray-900 mt-0.5 uppercase">
                {displayName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Email Share Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Mail className="h-4 w-4 text-white" />
              </div>
              Share Invoice via Email
            </DialogTitle>
            <DialogDescription>
              Send invoice {invoice?.invoiceNumber} to your client via email. AI will generate a professional email body.
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {shareSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-8 flex flex-col items-center gap-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center"
                >
                  <Check className="h-8 w-8 text-emerald-600" />
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground">Invoice Shared!</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Invoice {invoice?.invoiceNumber} has been shared with <span className="font-medium text-emerald-600">{shareEmail}</span>
                </p>
                <Button
                  className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowEmailDialog(false)}
                >
                  Done
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="share-email">Recipient Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="share-email"
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="pl-10 border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="share-message">
                    Personal Message <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    id="share-message"
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="Add a personal note to accompany the invoice..."
                    rows={3}
                    className="resize-none border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500"
                  />
                </div>

                {/* Invoice summary card */}
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Invoice</p>
                      <p className="font-semibold text-sm">{invoice?.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                        {cs}{invoice?.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowEmailDialog(false)}
                    disabled={shareLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendEmail}
                    disabled={shareLoading || !shareEmail.trim()}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    {shareLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Invoice
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}