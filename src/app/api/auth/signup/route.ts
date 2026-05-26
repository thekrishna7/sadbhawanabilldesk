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
        companyName: 'Sadbhawana Publication',
        companyAddress: 'Near Rajeev Gandhi School Ambah, Vallabh Colony Ambah, Morena (M.P.)',
        companyPhone: '+91 7987484155',
        companyEmail: 'sadbhawanapublication@gmail.com',
        companyLogo: '/logo.png',
        accountHolderName: 'Sadbhawana Publication',
        bankName: 'Punjab National Bank (PNB), Ambah',
        accountNumber: '0512102100000903',
        ifscCode: 'PUNB0051210',
        branchName: 'Ambah',
        gstNumber: 'GTZPS4321G',
        panNumber: 'GTZPS4321G',
        sealCompanyName: 'Sadbhawana Publication',
        sealDetail: 'Ambah Morena',
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
