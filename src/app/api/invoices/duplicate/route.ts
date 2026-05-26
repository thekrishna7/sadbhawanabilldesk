import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activityLogger'
import { getNextInvoiceNumber } from '@/lib/invoiceUtils'

export async function POST(req: NextRequest) {
  try {
    const { id, userId } = await req.json()

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    // Fetch the original invoice with items
    const original = await db.invoice.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!original) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (original.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Generate a unique invoice number for the duplicate using user settings
    const candidate = await getNextInvoiceNumber(userId)

    // Create the duplicated invoice
    const duplicated = await db.invoice.create({
      data: {
        userId,
        invoiceNumber: candidate,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: original.dueDate,
        status: 'draft',
        // Copy bill-to info
        billToName: original.billToName,
        billToPhone: original.billToPhone,
        billToEmail: original.billToEmail,
        billToAddress: original.billToAddress,
        // Copy totals
        subtotal: original.subtotal,
        taxTotal: original.taxTotal,
        grandTotal: original.grandTotal,
        // Reset payment-related fields
        receivedAmount: 0,
        previousBalance: 0,
        currentBalance: original.grandTotal,
        amountInWords: original.amountInWords,
        // Copy terms
        termsText: original.termsText,
        // Copy customer reference
        customerId: original.customerId,
        // Copy items
        items: {
          create: original.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            taxPercent: item.taxPercent,
            amount: item.amount,
          })),
        },
      },
      include: { items: true },
    })

    // Log activity
    await logActivity({
      userId,
      action: 'duplicated',
      entityType: 'invoice',
      entityId: duplicated.id,
      description: `Duplicated invoice ${original.invoiceNumber} as ${candidate}`,
      metadata: {
        originalInvoiceId: original.id,
        originalInvoiceNumber: original.invoiceNumber,
        newInvoiceNumber: candidate,
      },
    })

    return NextResponse.json({ invoice: duplicated })
  } catch (error) {
    console.error('Invoice duplicate error:', error)
    return NextResponse.json({ error: 'Failed to duplicate invoice' }, { status: 500 })
  }
}
