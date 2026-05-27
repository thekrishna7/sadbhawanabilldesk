'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Printer,
  Loader2,
  Building2,
} from 'lucide-react'
import { format } from 'date-fns'

import { getCurrencySymbol } from '@/lib/currency'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

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

export default function PublicInvoicePreview({ invoiceId, onClose }: { invoiceId: string; onClose?: () => void }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    if (!invoiceId) return

    setLoading(true)
    fetch(`/api/public/invoice?id=${invoiceId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Invoice not found')
        return r.json()
      })
      .then((data) => {
        if (data.invoice) {
          setInvoice(data.invoice)
        }
        if (data.businessProfile) {
          setBusinessProfile(data.businessProfile)
        }
      })
      .catch(() => {
        toast.error('Failed to load invoice')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [invoiceId])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground text-sm">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 gap-4">
        <p className="text-muted-foreground">Invoice not found or invalid link.</p>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Go Back
          </Button>
        )}
      </div>
    )
  }

  const company: BusinessProfile = {
    companyName: businessProfile?.companyName || 'Sadbhawana Publication',
    companyAddress: businessProfile?.companyAddress || 'Near Rajeev Gandhi School Ambah, Vallabh Colony Ambah, Morena (M.P.)',
    companyPhone: businessProfile?.companyPhone || '+91 7987484155',
    companyEmail: businessProfile?.companyEmail || 'sadbhawanapublication@gmail.com',
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
  const upiId = company.ifscCode ? `${company.accountNumber}@${company.bankName.toLowerCase().includes('pnb') ? 'pnb' : 'ybl'}` : 'sadbhawanapublication@pnb'
  const qrCodeSrc = company.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(displayName)}&am=${invoice.grandTotal}&cu=INR`)}`
  const cs = getCurrencySymbol(invoice.currency || 'INR')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 md:p-6 space-y-4">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden,
          aside, nav, header, button, .no-print {
            display: none !important;
          }
          main, div.min-h-screen, .max-w-4xl {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            background: transparent !important;
          }
          @page {
            size: A4;
            margin: 0.15in 10mm 0.15in 10mm !important;
          }
          .print-single-page {
            width: 100% !important;
            height: 100% !important;
            padding: 24px !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 16px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            background-color: white !important;
            overflow: hidden !important;
          }
        }
      `}} />

      {/* Action Buttons - hidden on print */}
      <div className="print:hidden flex items-center justify-between max-w-4xl mx-auto">
        <div className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Invoice Preview</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handlePrint}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
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
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-gray-200 bg-white">
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
                  {company.companyPhone && company.companyEmail && <span className="text-gray-300">|</span>}
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
              <div className="border border-gray-250 rounded-xl p-3 bg-white shadow-sm shrink-0">
                <img
                  src={qrCodeSrc}
                  alt="UPI QR Code"
                  className="w-28 h-28 object-contain"
                />
              </div>
              <span className="text-[11px] font-normal text-gray-500 mt-1.5 tracking-wide uppercase">Scan for Paying Amount</span>
            </div>

            {/* Signature Section */}
            <div className="text-center min-w-[200px]">
              {company.signatureImage ? (
                <div className="mb-1.5 h-14 flex items-end justify-center">
                  <img
                    src={company.signatureImage}
                    alt="Authorized Signature"
                    className="max-h-14 object-contain"
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
  </div>
  )
}
