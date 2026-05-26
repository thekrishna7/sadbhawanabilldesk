import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId || !customerId) {
      return NextResponse.json({ error: 'userId and customerId are required' }, { status: 400 })
    }

    // Get customer info
    const customer = await db.customer.findFirst({
      where: { id: customerId, userId },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Build where clause for invoices
    const where: Record<string, unknown> = {
      userId,
      deletedAt: null,
      customerId,
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {}
      if (startDate) dateFilter.gte = startDate
      if (endDate) dateFilter.lte = endDate
      where.invoiceDate = dateFilter
    }

    // Also match by billToName if customerId is null on invoice
    const invoices = await db.invoice.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { customerId },
          { billToName: customer.name },
        ],
        ...(startDate || endDate ? {
          invoiceDate: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        } : {}),
      },
      include: { items: true, payments: true },
      orderBy: { invoiceDate: 'asc' },
    })

    // Build statement items with running balance
    let runningBalance = 0
    const statementItems = invoices.map(inv => {
      const paid = inv.receivedAmount || 0
      runningBalance += inv.grandTotal - paid
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        amount: inv.grandTotal,
        paid,
        balance: Math.max(0, runningBalance),
        status: inv.status,
      }
    })

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.receivedAmount || 0), 0)
    const outstandingBalance = Math.max(0, totalInvoiced - totalPaid)

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
      statementItems,
      totalInvoiced: Math.round(totalInvoiced * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
    })
  } catch (error) {
    console.error('Customer statement error:', error)
    return NextResponse.json({ error: 'Failed to fetch customer statement' }, { status: 500 })
  }
}
