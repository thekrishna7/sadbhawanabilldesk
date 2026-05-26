import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, signatureImage } = data

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const profile = await db.businessProfile.upsert({
      where: { userId },
      update: { signatureImage },
      create: { userId, signatureImage }
    })

    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update signature' }, { status: 500 })
  }
}
