/**
 * Mailer utility — Nodemailer with Gmail SMTP
 * Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM in .env
 */
import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  })

  return transporter
}

export function isEmailConfigured(): boolean {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
}

// ===== Main send function =====
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
}: {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}) {
  if (!isEmailConfigured()) {
    console.warn('[Mailer] Email not configured. Set EMAIL_USER and EMAIL_PASS in .env')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const t = getTransporter()
    const defaultFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@sadbhawanabilldesk.com'
    const info = await t.sendMail({
      from: from || defaultFrom,
      to,
      subject,
      html,
      text,
      replyTo: replyTo || from || defaultFrom,
    })
    console.log('[Mailer] Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('[Mailer] Failed to send email:', error)
    return { success: false, error: String(error) }
  }
}

// ===== Invoice Email Template =====
export function buildInvoiceEmailHtml({
  companyName,
  customerName,
  invoiceNumber,
  amount,
  dueDate,
  currency,
  message,
  items,
  invoiceId,
}: {
  companyName: string
  customerName: string
  invoiceNumber: string
  amount: string
  dueDate: string
  currency: string
  message?: string
  items: { description: string }[]
  invoiceId: string
}) {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency
  const itemList = items
    .filter((i) => i.description)
    .map((i) => `<li style="margin: 4px 0; color: #444;">${i.description}</li>`)
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(5,150,105,0.08);border:1px solid #e8eef8;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#047857 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">
                ${companyName}
              </h1>
              <p style="margin:8px 0 0;color:#a7f3d0;font-size:13px;">Invoice Notification</p>
            </td>
          </tr>
          <!-- Gold divider -->
          <tr>
            <td style="background:#f59e0b;height:4px;"></td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;color:#333;font-size:16px;">Dear <strong>${customerName}</strong>,</p>
              <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
                Please find below the details for invoice <strong>${invoiceNumber}</strong>. 
                We look forward to your prompt payment.
              </p>

              <!-- Invoice Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#666;font-size:13px;padding:6px 0;">Invoice Number</td>
                        <td style="color:#059669;font-weight:700;font-size:13px;text-align:right;">${invoiceNumber}</td>
                      </tr>
                      <tr>
                        <td style="color:#666;font-size:13px;padding:6px 0;">Amount Due</td>
                        <td style="color:#059669;font-weight:700;font-size:20px;text-align:right;">${currencySymbol}${amount}</td>
                      </tr>
                      <tr>
                        <td style="color:#666;font-size:13px;padding:6px 0;">Due Date</td>
                        <td style="color:#d97706;font-weight:600;font-size:13px;text-align:right;">${dueDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${
                itemList
                  ? `<p style="margin:0 0 8px;color:#333;font-size:14px;font-weight:600;">Items / Services:</p>
              <ul style="margin:0 0 24px;padding-left:20px;">${itemList}</ul>`
                  : ''
              }

              ${
                message
                  ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin-bottom:24px;">
                <p style="margin:0;color:#78350f;font-size:13px;font-style:italic;">"${message}"</p>
              </div>`
                  : ''
              }

              <!-- CTA Button to Download & View Invoice -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://sadbhawanabilldesk.vercel.app/?publicInvoiceId=${invoiceId}" target="_blank" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(5,150,105,0.25);">
                  Download & View Invoice
                </a>
              </div>

              <p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.6;">
                If you have any questions regarding this invoice, please don't hesitate to contact us.
              </p>
              <p style="margin:0;color:#555;font-size:14px;">Thank you for your business! 🙏</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8faff;border-top:1px solid #e8eef8;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#888;font-size:12px;">
                Powered by <strong style="color:#059669;">Sadbhawana BillDesk</strong> — Smart Billing Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// ===== Reminder Email Template =====
export function buildReminderEmailHtml({
  companyName,
  customerName,
  invoiceNumber,
  amount,
  dueDate,
  daysOverdue,
  currency,
}: {
  companyName: string
  customerName: string
  invoiceNumber: string
  amount: string
  dueDate: string
  daysOverdue: number
  currency: string
}) {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Payment Reminder</title></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(230,92,0,0.10);">
          <tr>
            <td style="background:linear-gradient(135deg,#c0392b 0%,#8B1A1A 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">⚠️ Payment Reminder</h1>
              <p style="margin:8px 0 0;color:#ffb3b3;font-size:13px;">${companyName}</p>
            </td>
          </tr>
          <tr><td style="background:#F5A623;height:4px;"></td></tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;color:#333;font-size:16px;">Dear <strong>${customerName}</strong>,</p>
              <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
                This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> is 
                <strong style="color:#c0392b;">${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue</strong>. 
                Kindly arrange payment at the earliest.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff0f0;border-radius:8px;border:1px solid #ffc0c0;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#666;font-size:13px;padding:6px 0;">Invoice Number</td>
                        <td style="color:#c0392b;font-weight:700;font-size:13px;text-align:right;">${invoiceNumber}</td>
                      </tr>
                      <tr>
                        <td style="color:#666;font-size:13px;padding:6px 0;">Outstanding Amount</td>
                        <td style="color:#c0392b;font-weight:700;font-size:20px;text-align:right;">${currencySymbol}${amount}</td>
                      </tr>
                      <tr>
                        <td style="color:#666;font-size:13px;padding:6px 0;">Original Due Date</td>
                        <td style="color:#c0392b;font-weight:600;font-size:13px;text-align:right;">${dueDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#555;font-size:14px;">Please contact us if you have any questions.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8faff;border-top:1px solid #e8eef8;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#888;font-size:12px;">Powered by <strong style="color:#0057D9;">Sadbhawana BillDesk</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
