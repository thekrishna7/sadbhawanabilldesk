import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User with this email does not exist' }, { status: 404 })
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiration

    // Save in DB
    await db.user.update({
      where: { email },
      data: {
        resetCode: code,
        resetCodeExpires: expires
      }
    })

    // Construct Email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Password Reset OTP</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,87,217,0.10);border:1px solid #e8eef8;">
          <!-- Header banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#047857 100%);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">
                Sadbhawana BillDesk
              </h1>
              <p style="margin:4px 0 0;color:#a7f3d0;font-size:12px;">Password Reset Verification</p>
            </td>
          </tr>
          <!-- Body content -->
          <tr>
            <td style="padding:32px 32px;text-align:center;">
              <p style="margin:0 0 16px;color:#333333;font-size:16px;font-weight:600;text-align:left;">Dear ${user.name || 'User'},</p>
              <p style="margin:0 0 24px;color:#555555;font-size:14px;line-height:1.6;text-align:left;">
                We received a request to reset your password. Use the following 6-digit verification code (OTP) to complete the process. This code is valid for 15 minutes.
              </p>

              <!-- OTP Code Display Box -->
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 24px;display:inline-block;margin:0 auto 24px;">
                <span style="font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:bold;letter-spacing:6px;color:#059669;">
                  ${code}
                </span>
              </div>

              <p style="margin:0 0 24px;color:#e11d48;font-size:12px;font-weight:600;">
                If you did not request this, please ignore this email or change your password immediately.
              </p>
              
              <div style="border-top:1px solid #e8eef8;padding-top:20px;">
                <p style="margin:0;color:#888888;font-size:12px;">
                  Thank you, <br/><strong>Sadbhawana BillDesk Team</strong>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

    // Send email
    const emailResult = await sendEmail({
      to: email,
      subject: `[Sadbhawana BillDesk] OTP Code: ${code} - Reset Password`,
      html: emailHtml
    })

    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error)
      return NextResponse.json({ error: 'Failed to send OTP email. Please verify SMTP settings.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Password reset request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
