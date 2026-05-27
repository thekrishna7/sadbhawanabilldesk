import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'All fields (email, code, new password) are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User with this email does not exist' }, { status: 404 })
    }

    // Verify OTP code
    if (!user.resetCode || user.resetCode !== code.trim()) {
      return NextResponse.json({ error: 'Invalid verification code (OTP)' }, { status: 400 })
    }

    // Verify Expiry
    if (!user.resetCodeExpires || user.resetCodeExpires < new Date()) {
      return NextResponse.json({ error: 'Verification code (OTP) has expired' }, { status: 400 })
    }

    // Update password and clear code fields
    await db.user.update({
      where: { email },
      data: {
        password: newPassword,
        resetCode: null,
        resetCodeExpires: null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Password reset submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
