import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, isEmailConfigured } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Email configuration is missing from your .env file. Please define EMAIL_USER and EMAIL_PASS.' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || !user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    const subject = 'Test Email — Sadbhawana BillDesk'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0057D9; margin-top: 0;">Sadbhawana BillDesk</h2>
        <p>Hello <strong>${user.name || 'User'}</strong>,</p>
        <p>This is a test email to confirm that your SMTP configuration in the <code>.env</code> file is working correctly.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; border-left: 4px solid #0057D9; margin: 20px 0;">
          <strong>Configuration Verified Successfully! ✓</strong>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
          If you received this, your email notifications for invoices, payments, and reminders will function correctly.
        </p>
      </div>
    `

    const res = await sendEmail({
      to: user.email,
      subject,
      html,
      text: `Hello ${user.name || 'User'},\n\nThis is a test email to confirm that your SMTP configuration is working correctly.`
    })

    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Failed to send test email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, to: user.email })
  } catch (error) {
    console.error('Test email route error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
