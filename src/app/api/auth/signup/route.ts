import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const user = await db.user.create({
      data: { email, name: name || '', phone: phone || '', password }
    })

    // Create default business profile
    await db.businessProfile.create({
      data: {
        userId: user.id,
      }
    })

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        darkMode: user.darkMode,
        language: user.language,
        notifications: user.notifications,
        defaultTaxRate: user.defaultTaxRate,
        defaultDueDays: user.defaultDueDays,
        invoiceFormat: user.invoiceFormat
      } 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
