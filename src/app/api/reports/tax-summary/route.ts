import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force recompile after schema changes
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Build where clause
    const where: Record<string, unknown> = {
      userId,
      deletedAt: null,
      currency: 'INR', // Only INR invoices for GST report
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {}
      if (startDate) dateFilter.gte = startDate
      if (endDate) dateFilter.lte = endDate
      where.invoiceDate = dateFilter
    }

    const invoices = await db.invoice.findMany({
      where,
      include: { items: true },
    })

    // Group by tax rate
    const taxGroups: Record<number, { taxableAmount: number; cgst: number; sgst: number; igst: number; totalTax: number; invoiceCount: Set<string> }> = {}

    for (const invoice of invoices) {
      for (const item of invoice.items) {
        const taxRate = item.taxPercent || 0
        const taxableAmount = item.quantity * item.rate
        const taxAmount = (taxableAmount * taxRate) / 100

        // For GST: CGST + SGST (each half of total tax rate) for intra-state
        const halfRate = taxRate / 2

        if (!taxGroups[taxRate]) {
          taxGroups[taxRate] = { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, invoiceCount: new Set() }
        }

        taxGroups[taxRate].taxableAmount += taxableAmount
        taxGroups[taxRate].cgst += (taxableAmount * halfRate) / 100
        taxGroups[taxRate].sgst += (taxableAmount * halfRate) / 100
        taxGroups[taxRate].igst += 0
        taxGroups[taxRate].totalTax += taxAmount
        taxGroups[taxRate].invoiceCount.add(invoice.id)
      }
    }

    // Sort by tax rate
    const taxSummary = Object.entries(taxGroups)
      .map(([rate, data]) => ({
        taxRate: parseFloat(rate),
        taxableAmount: Math.round(data.taxableAmount * 100) / 100,
        cgst: Math.round(data.cgst * 100) / 100,
        sgst: Math.round(data.sgst * 100) / 100,
        igst: Math.round(data.igst * 100) / 100,
        totalTax: Math.round(data.totalTax * 100) / 100,
        invoiceCount: data.invoiceCount.size,
      }))
      .sort((a, b) => a.taxRate - b.taxRate)

    const totalTaxableAmount = taxSummary.reduce((sum, t) => sum + t.taxableAmount, 0)
    const totalTax = taxSummary.reduce((sum, t) => sum + t.totalTax, 0)
    const totalCgst = taxSummary.reduce((sum, t) => sum + t.cgst, 0)
    const totalSgst = taxSummary.reduce((sum, t) => sum + t.sgst, 0)
    const grandTotal = totalTaxableAmount + totalTax

    return NextResponse.json({
      taxSummary,
      totalTaxableAmount: Math.round(totalTaxableAmount * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    })
  } catch (error) {
    console.error('Tax summary error:', error)
    return NextResponse.json({ error: 'Failed to fetch tax summary' }, { status: 500 })
  }
}
