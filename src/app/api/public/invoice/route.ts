import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch business profile of the creator
    const businessProfile = await db.businessProfile.findUnique({
      where: { userId: invoice.userId }
    })

    return NextResponse.json({ invoice, businessProfile })
  } catch (error: any) {
    console.error('Fetch public invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
