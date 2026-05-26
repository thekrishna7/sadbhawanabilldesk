import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Build date filter if provided
    const dateFilter: Record<string, unknown> = {}
    if (startDate || endDate) {
      const invDateFilter: Record<string, unknown> = {}
      if (startDate) invDateFilter.gte = startDate
      if (endDate) invDateFilter.lte = endDate
      dateFilter.invoiceDate = invDateFilter
    }

    // Get total invoices (non-deleted)
    const totalInvoices = await db.invoice.count({
      where: { userId, deletedAt: null, ...dateFilter }
    })

    // Get paid invoices
    const paidInvoices = await db.invoice.count({
      where: { userId, status: 'paid', deletedAt: null, ...dateFilter }
    })

    // Get pending invoices
    const pendingInvoices = await db.invoice.count({
      where: { userId, status: { in: ['draft', 'sent'] }, deletedAt: null, ...dateFilter }
    })

    // Get overdue invoices
    const overdueInvoices = await db.invoice.count({
      where: { userId, status: 'overdue', deletedAt: null, ...dateFilter }
    })

    // Calculate revenue
    const invoices = await db.invoice.findMany({
      where: { userId, deletedAt: null, ...dateFilter },
      select: { grandTotal: true, status: true, invoiceDate: true }
    })

    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.grandTotal, 0)

    const pendingAmount = invoices
      .filter(i => i.status !== 'paid')
      .reduce((sum, i) => sum + i.grandTotal, 0)

    // Recent invoices
    const recentInvoices = await db.invoice.findMany({
      where: { userId, deletedAt: null, ...dateFilter },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Monthly revenue (last 6 months) - still use all data for chart unless custom range
    const allInvoices = startDate || endDate ? invoices : await db.invoice.findMany({
      where: { userId, deletedAt: null },
      select: { grandTotal: true, status: true, invoiceDate: true }
    })

    const now = new Date()
    const monthlyRevenue: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthStr = month.toLocaleString('default', { month: 'short' })
      
      const monthInvoices = allInvoices.filter(inv => {
        const d = new Date(inv.invoiceDate)
        return d >= month && d <= monthEnd && inv.status === 'paid'
      })
      const revenue = monthInvoices.reduce((sum, i) => sum + i.grandTotal, 0)
      monthlyRevenue.push({ month: monthStr, revenue })
    }

    return NextResponse.json({
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
      pendingAmount,
      recentInvoices,
      monthlyRevenue,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
