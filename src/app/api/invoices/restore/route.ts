import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    await db.invoice.update({
      where: { id },
      data: {
        deletedAt: null,
        permanentDeleteAt: null,
        status: 'draft'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to restore invoice' }, { status: 500 })
  }
}
