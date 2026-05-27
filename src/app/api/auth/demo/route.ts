import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // Check if demo user already exists
    let user = await db.user.findUnique({
      where: { email: 'demo@billflow.com' }
    })

    if (!user) {
      // Create demo user
      user = await db.user.create({
        data: {
          id: 'demo-user',
          email: 'demo@billflow.com',
          name: 'Demo User',
          phone: '+91 9876543210',
          password: 'demopassword',
          darkMode: false,
          language: 'en',
          notifications: true,
          defaultTaxRate: '18',
          defaultDueDays: '30',
          invoiceFormat: 'INV-{YYYY}-{000}'
        }
      })

      // Create default business profile for demo user
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
    }

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
  } catch (error: any) {
    console.error('Demo login error:', error)
    return NextResponse.json({ error: 'Failed to initialize demo account' }, { status: 500 })
  }
}
