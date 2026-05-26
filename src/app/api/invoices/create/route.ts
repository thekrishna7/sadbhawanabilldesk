import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getNextInvoiceNumber } from '@/lib/invoiceUtils'
import { createNotification, sendPushToUser } from '@/lib/notificationHelper'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, items, ...invoiceData } = data

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Generate a unique invoice number
    let invoiceNumber = invoiceData.invoiceNumber

    if (!invoiceNumber) {
      invoiceNumber = await getNextInvoiceNumber(userId)
    } else {
      // Verify the provided invoice number is unique. If a collision is found, increment until a free one is found.
      let candidate = invoiceNumber
      let candidateNum = 1

      while (true) {
        const existing = await db.invoice.findUnique({ where: { invoiceNumber: candidate } })
        if (!existing) {
          invoiceNumber = candidate
          break
        }
        const match = invoiceNumber.match(/^(.*?)(\d+)$/)
        if (match) {
          const prefix = match[1]
          const numStr = match[2]
          const nextNum = parseInt(numStr, 10) + candidateNum
          candidate = `${prefix}${String(nextNum).padStart(numStr.length, '0')}`
        } else {
          candidate = `${invoiceNumber}-${candidateNum}`
        }
        candidateNum++
      }
    }

    const currency = invoiceData.currency || 'INR'

    // Explicitly build only known schema fields, coercing null/undefined numerics to 0
    const invoicePayload = {
      invoiceNumber,
      invoiceDate: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
      status: invoiceData.status || 'draft',
      billToName: invoiceData.billToName || '',
      billToPhone: invoiceData.billToPhone || '',
      billToEmail: invoiceData.billToEmail || '',
      billToAddress: invoiceData.billToAddress || '',
      subtotal: Number(invoiceData.subtotal) || 0,
      taxTotal: Number(invoiceData.taxTotal) || 0,
      discountText: invoiceData.discountText || '',
      discountTotal: Number(invoiceData.discountTotal) || 0,
      grandTotal: Number(invoiceData.grandTotal) || 0,
      receivedAmount: Number(invoiceData.receivedAmount) || 0,
      previousBalance: Number(invoiceData.previousBalance) || 0,
      currentBalance: Number(invoiceData.currentBalance) || 0,
      amountInWords: invoiceData.amountInWords || '',
      termsText: invoiceData.termsText || '',
      currency,
    }

    const invoice = await db.invoice.create({
      data: {
        ...invoicePayload,
        // Prisma v6: use connect for required relations instead of passing raw scalar userId
        user: { connect: { id: userId } },
        items: {
          create: (items || []).map((item: {
            description?: string
            quantity?: number
            rate?: number
            taxPercent?: number
            amount?: number
          }) => ({
            description: item.description || '',
            quantity: Number(item.quantity) || 0,
            rate: Number(item.rate) || 0,
            taxPercent: Number(item.taxPercent) || 0,
            amount: Number(item.amount) || 0,
          })),
        },
      },
      include: { items: true },
    })

    // Auto-save customer if name + email provided
    if (invoiceData.billToName && invoiceData.billToEmail) {
      const existingCustomer = await db.customer.findFirst({
        where: { userId, email: invoiceData.billToEmail },
      })
      if (!existingCustomer) {
        await db.customer.create({
          data: {
            user: { connect: { id: userId } },
            name: invoiceData.billToName,
            phone: invoiceData.billToPhone || '',
            email: invoiceData.billToEmail || '',
            address: invoiceData.billToAddress || '',
          },
        })
      }
    }

    // Fire in-app notification + push
    const notifType = invoicePayload.status === 'sent' ? 'invoice_sent' : 'invoice_created'
    const notifTitle =
      invoicePayload.status === 'sent'
        ? `Invoice ${invoice.invoiceNumber} sent`
        : `Invoice ${invoice.invoiceNumber} saved as draft`
    const notifMessage = invoiceData.billToName
      ? `${invoicePayload.status === 'sent' ? 'Sent to' : 'For'} ${invoiceData.billToName} — ₹${invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      : `Amount: ₹${invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

    await createNotification({
      userId,
      type: notifType,
      title: notifTitle,
      message: notifMessage,
      entityId: invoice.id,
      entityType: 'invoice',
    })

    // Push notification (silent if web-push not configured)
    await sendPushToUser(userId, notifTitle, notifMessage)

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Invoice creation error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
