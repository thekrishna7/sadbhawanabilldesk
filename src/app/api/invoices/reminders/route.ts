import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const now = new Date().toISOString().split('T')[0]

    // Get overdue invoices
    const overdueInvoices = await db.invoice.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: ['sent', 'overdue'] },
        dueDate: { lt: now },
      },
      include: { items: true },
      orderBy: { dueDate: 'asc' },
    })

    // Get invoices due soon (next 3 days)
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const dueSoonInvoices = await db.invoice.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: ['sent', 'draft'] },
        dueDate: { gte: now, lte: threeDaysFromNow },
      },
      orderBy: { dueDate: 'asc' },
    })

    // Auto-mark overdue invoices
    for (const inv of overdueInvoices) {
      if (inv.status !== 'overdue') {
        await db.invoice.update({
          where: { id: inv.id },
          data: { status: 'overdue' },
        })
      }
    }

    const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.currentBalance, 0)
    const totalDueSoonAmount = dueSoonInvoices.reduce((sum, inv) => sum + inv.currentBalance, 0)

    return NextResponse.json({
      overdueInvoices: overdueInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        billToName: inv.billToName,
        grandTotal: inv.grandTotal,
        currentBalance: inv.currentBalance,
        dueDate: inv.dueDate,
        currency: inv.currency,
      })),
      dueSoonInvoices: dueSoonInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        billToName: inv.billToName,
        grandTotal: inv.grandTotal,
        currentBalance: inv.currentBalance,
        dueDate: inv.dueDate,
        currency: inv.currency,
      })),
      totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100,
      totalDueSoonAmount: Math.round(totalDueSoonAmount * 100) / 100,
      overdueCount: overdueInvoices.length,
      dueSoonCount: dueSoonInvoices.length,
    })
  } catch (error) {
    console.error('Payment reminders error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment reminders' }, { status: 500 })
  }
}
