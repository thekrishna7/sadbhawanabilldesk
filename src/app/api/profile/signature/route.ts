import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, signatureImage } = data

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
      update: { signatureImage },
      create: { userId, signatureImage }
    })

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('Error updating signature profile:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update signature' },
      { status: 500 }
    )
  }
}
