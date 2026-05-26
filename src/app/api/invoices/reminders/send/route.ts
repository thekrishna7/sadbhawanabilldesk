import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, buildReminderEmailHtml, isEmailConfigured } from '@/lib/mailer'
import { createNotification } from '@/lib/notificationHelper'
import { logActivity } from '@/lib/activityLogger'

// POST /api/invoices/reminders/send
// Body: { invoiceId, userId }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invoiceId, userId } = body

    if (!invoiceId || !userId) {
      return NextResponse.json({ error: 'invoiceId and userId are required' }, { status: 400 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!invoice.billToEmail) {
      return NextResponse.json(
        { error: 'Invoice has no customer email address. Please add an email to the customer.' },
        { status: 400 }
      )
    }

    const businessProfile = await db.businessProfile.findUnique({ where: { userId } })
    const companyName = businessProfile?.companyName || 'Sadbhawana BillDesk'

    // Fetch user details for dynamic sender header
    const user = await db.user.findUnique({ where: { id: userId } })
    const userEmail = user?.email || businessProfile?.companyEmail || process.env.EMAIL_USER || 'noreply@sadbhawanabilldesk.com'
    const userName = user?.name || businessProfile?.companyName || 'Sadbhawana BillDesk'

    // Calculate days overdue
    const now = new Date()
    const due = new Date(invoice.dueDate)
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))

    const currencySymbol =
      invoice.currency === 'INR' ? '₹' : invoice.currency === 'USD' ? '$' : invoice.currency === 'EUR' ? '€' : '₹'

    const formattedAmount = invoice.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    const formattedDueDate = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'N/A'

    const subject = `⚠️ Payment Reminder: Invoice ${invoice.invoiceNumber} from ${companyName} — ${currencySymbol}${formattedAmount} Due`

    const html = buildReminderEmailHtml({
      companyName,
      customerName: invoice.billToName || 'Valued Customer',
      invoiceNumber: invoice.invoiceNumber,
      amount: formattedAmount,
      dueDate: formattedDueDate,
      daysOverdue,
      currency: invoice.currency,
    })

    const plainText = `
Payment Reminder from ${companyName}

Dear ${invoice.billToName || 'Valued Customer'},

This is a friendly reminder that invoice ${invoice.invoiceNumber} is ${daysOverdue} day(s) overdue.
Outstanding Amount: ${currencySymbol}${formattedAmount}
Original Due Date: ${formattedDueDate}

Please arrange payment at the earliest convenience.

${companyName}
    `.trim()

    let emailSent = false
    let emailError = ''

    if (isEmailConfigured()) {
      const result = await sendEmail({
        to: invoice.billToEmail,
        subject,
        html,
        text: plainText,
        from: `"${userName}" <${process.env.EMAIL_USER}>`,
        replyTo: userEmail,
      })
      emailSent = result.success
      if (!result.success) emailError = result.error || 'Unknown error'
    } else {
      emailError = 'Email not configured'
    }

    // Create in-app notification
    await createNotification({
      userId,
      type: 'reminder',
      title: `Reminder sent for ${invoice.invoiceNumber}`,
      message: `Reminder email ${emailSent ? 'sent to' : 'could not be sent to'} ${invoice.billToEmail}`,
      entityId: invoiceId,
      entityType: 'invoice',
    })

    // Log activity
    await logActivity({
      userId,
      action: 'reminder_sent',
      entityType: 'invoice',
      entityId: invoiceId,
      description: `Payment reminder sent for invoice ${invoice.invoiceNumber} to ${invoice.billToEmail}`,
      metadata: { daysOverdue, emailSent, emailError },
    })

    return NextResponse.json({
      success: true,
      emailSent,
      emailError: emailSent ? undefined : emailError,
      to: invoice.billToEmail,
      invoiceNumber: invoice.invoiceNumber,
    })
  } catch (error) {
    console.error('Reminder send error:', error)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }
}
