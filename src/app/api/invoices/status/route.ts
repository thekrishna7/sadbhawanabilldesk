import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    const validStatuses = ['draft', 'sent', 'paid', 'overdue']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice status' }, { status: 500 })
  }
}
