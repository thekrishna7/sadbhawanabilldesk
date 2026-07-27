import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, id, ...bankData } = data

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const userExists = await db.user.findUnique({ where: { id: userId } })
    if (!userExists) {
      await db.user.create({
        data: {
          id: userId,
          email: `${userId}@app.com`,
          name: 'User',
          password: 'defaultpassword',
        }
      })
    }

    const profile = await db.businessProfile.upsert({
      where: { userId },
      update: bankData,
      create: { userId, ...bankData }
    })

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('Error updating bank profile:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update bank details' },
      { status: 500 }
    )
  }
}
