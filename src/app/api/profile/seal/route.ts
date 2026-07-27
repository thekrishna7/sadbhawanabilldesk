import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, sealImage, sealCompanyName, sealDetail, useSeal } = data

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const userExists = await db.user.findUnique({ where: { id: userId } })
    if (!userExists) {
      await db.user.create({
        data: {
          id: userId,
          email: `${userId}@app.com`,
          name: sealCompanyName || 'User',
          password: 'defaultpassword',
        }
      })
    }

    const profile = await db.businessProfile.upsert({
      where: { userId },
      update: { sealImage, sealCompanyName, sealDetail, useSeal },
      create: { userId, sealImage: sealImage || '', sealCompanyName: sealCompanyName || '', sealDetail: sealDetail || '', useSeal: useSeal || false }
    })

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('Error updating seal profile:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update seal' },
      { status: 500 }
    )
  }
}
