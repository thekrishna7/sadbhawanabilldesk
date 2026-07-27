import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, id, ...businessData } = data

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Ensure user exists in database to prevent Foreign Key constraint failure (P2003)
    const userExists = await db.user.findUnique({ where: { id: userId } })
    if (!userExists) {
      await db.user.create({
        data: {
          id: userId,
          email: businessData.companyEmail || `${userId}@app.com`,
          name: businessData.companyName || 'User',
          password: 'defaultpassword',
        }
      })
    }

    const profile = await db.businessProfile.upsert({
      where: { userId },
      update: businessData,
      create: { userId, ...businessData }
    })

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('Error updating business profile:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update business profile' },
      { status: 500 }
    )
  }
}
