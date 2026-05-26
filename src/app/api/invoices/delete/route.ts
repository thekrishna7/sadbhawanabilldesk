import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { id, permanent } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    if (permanent) {
      await db.invoice.delete({ where: { id } })
    } else {
      // Soft delete - move to recycle bin
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      
      await db.invoice.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          permanentDeleteAt: sevenDaysFromNow,
          status: 'deleted'
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
