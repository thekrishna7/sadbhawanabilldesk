import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getNextInvoiceNumber } from '@/lib/invoiceUtils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const id = searchParams.get('id')
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (searchParams.get('nextNumber') === 'true') {
      const nextInvoiceNumber = await getNextInvoiceNumber(userId)
      return NextResponse.json({ nextInvoiceNumber })
    }

    // If an id is provided, return a single invoice
    if (id) {
      const invoice = await db.invoice.findUnique({
        where: { id },
        include: { items: true, customer: true },
      })
      if (!invoice || invoice.userId !== userId) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      return NextResponse.json({ invoice })
    }

    const where: Record<string, unknown> = {
      userId,
    }

    // Handle deleted invoices (for recycle bin)
    if (status === 'deleted') {
      where.deletedAt = { not: null }
    } else if (!includeDeleted) {
      where.deletedAt = null
    }

    if (status && status !== 'all' && status !== 'deleted') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { billToName: { contains: search } },
      ]
    }

    const invoices = await db.invoice.findMany({
      where,
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Invoice fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
