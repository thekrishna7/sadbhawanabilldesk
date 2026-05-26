import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, items, userId, ...invoiceData } = data

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Delete existing items and recreate
    if (items) {
      await db.invoiceItem.deleteMany({ where: { invoiceId: id } })
    }

    // Explicitly pick only known schema fields, coercing null/undefined numerics to 0
    const updatePayload: Record<string, unknown> = {
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      status: invoiceData.status,
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
      currency: invoiceData.currency || 'INR',
    }

    // Remove undefined keys to avoid accidentally nulling out fields
    Object.keys(updatePayload).forEach(
      (key) => updatePayload[key] === undefined && delete updatePayload[key]
    )

    const invoice = await db.invoice.update({
      where: { id },
      data: {
        ...updatePayload,
        items: items
          ? {
              create: items.map((item: {
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
            }
          : undefined,
      },
      include: { items: true },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Invoice update error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}
