import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force recompile after schema changes
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Fetch invoices that are sent or overdue (unpaid receivables)
    const invoices = await db.invoice.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: ['sent', 'overdue'] },
      },
      select: {
        id: true,
        invoiceNumber: true,
        dueDate: true,
        grandTotal: true,
        receivedAmount: true,
        currentBalance: true,
        status: true,
        billToName: true,
        customer: {
          select: { name: true },
        },
      },
    })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Initialize aging buckets
    const buckets = [
      { label: 'Current', range: '0-30 days', minDays: -Infinity, maxDays: 30, color: 'emerald', count: 0, total: 0, invoices: [] as { id: string; invoiceNumber: string; billToName: string; balance: number; daysPastDue: number }[] },
      { label: '31-60 Days', range: '31-60 days', minDays: 31, maxDays: 60, color: 'yellow', count: 0, total: 0, invoices: [] as { id: string; invoiceNumber: string; billToName: string; balance: number; daysPastDue: number }[] },
      { label: '61-90 Days', range: '61-90 days', minDays: 61, maxDays: 90, color: 'orange', count: 0, total: 0, invoices: [] as { id: string; invoiceNumber: string; billToName: string; balance: number; daysPastDue: number }[] },
      { label: '90+ Days', range: '90+ days', minDays: 91, maxDays: Infinity, color: 'red', count: 0, total: 0, invoices: [] as { id: string; invoiceNumber: string; billToName: string; balance: number; daysPastDue: number }[] },
    ]

    for (const inv of invoices) {
      const balance = inv.currentBalance || (inv.grandTotal - inv.receivedAmount) || inv.grandTotal
      if (balance <= 0) continue

      const dueDate = new Date(inv.dueDate)
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
      const diffMs = today.getTime() - dueDateOnly.getTime()
      const daysPastDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      // If not yet due (daysPastDue < 0), treat as current
      const effectiveDays = Math.max(0, daysPastDue)

      const invoiceData = {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        billToName: inv.customer?.name || inv.billToName || 'Unknown',
        balance: Math.round(balance * 100) / 100,
        daysPastDue: effectiveDays,
      }

      // Find the right bucket
      for (const bucket of buckets) {
        if (effectiveDays >= bucket.minDays && effectiveDays <= bucket.maxDays) {
          bucket.count += 1
          bucket.total += balance
          bucket.invoices.push(invoiceData)
          break
        }
      }
    }

    // Round totals
    for (const bucket of buckets) {
      bucket.total = Math.round(bucket.total * 100) / 100
    }

    const totalReceivables = buckets.reduce((sum, b) => sum + b.total, 0)
    const totalInvoiceCount = buckets.reduce((sum, b) => sum + b.count, 0)

    return NextResponse.json({
      buckets,
      totalReceivables: Math.round(totalReceivables * 100) / 100,
      totalInvoiceCount,
    })
  } catch (error) {
    console.error('Aging summary error:', error)
    return NextResponse.json({ error: 'Failed to fetch aging summary' }, { status: 500 })
  }
}
