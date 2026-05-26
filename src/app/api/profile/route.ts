import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    const businessProfile = await db.businessProfile.findUnique({ where: { userId } })

    return NextResponse.json({ user, businessProfile })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, ...updateData } = data

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Update user fields if provided
    const userUpdateFields: any = {}
    if (updateData.name !== undefined) userUpdateFields.name = updateData.name
    if (updateData.phone !== undefined) userUpdateFields.phone = updateData.phone
    if (updateData.email !== undefined) userUpdateFields.email = updateData.email
    if (updateData.profilePhoto !== undefined) userUpdateFields.profilePhoto = updateData.profilePhoto
    if (updateData.darkMode !== undefined) userUpdateFields.darkMode = updateData.darkMode
    if (updateData.language !== undefined) userUpdateFields.language = updateData.language
    if (updateData.notifications !== undefined) userUpdateFields.notifications = updateData.notifications
    if (updateData.defaultTaxRate !== undefined) userUpdateFields.defaultTaxRate = String(updateData.defaultTaxRate)
    if (updateData.defaultDueDays !== undefined) userUpdateFields.defaultDueDays = String(updateData.defaultDueDays)
    if (updateData.invoiceFormat !== undefined) userUpdateFields.invoiceFormat = updateData.invoiceFormat

    let updatedUser: any = null
    if (Object.keys(userUpdateFields).length > 0) {
      updatedUser = await db.user.update({
        where: { id: userId },
        data: userUpdateFields,
      })
    }

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
