import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, ...businessData } = data

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const profile = await db.businessProfile.upsert({
      where: { userId },
      update: businessData,
      create: { userId, ...businessData }
    })

    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update business profile' }, { status: 500 })
  }
}
