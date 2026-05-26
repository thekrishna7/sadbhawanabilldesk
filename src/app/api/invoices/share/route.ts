import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activityLogger'
import { sendEmail, buildInvoiceEmailHtml, isEmailConfigured } from '@/lib/mailer'
import { createNotification } from '@/lib/notificationHelper'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invoiceId, userId, email, message } = body

    // Validate required fields
    if (!invoiceId || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceId, userId, email' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    // Fetch the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to share this invoice' },
        { status: 403 }
      )
    }

    // Fetch business profile for company name
    const businessProfile = await db.businessProfile.findUnique({ where: { userId } })
    const companyName = businessProfile?.companyName || 'Sadbhawana BillDesk'

    // Fetch user details for dynamic sender header
    const user = await db.user.findUnique({ where: { id: userId } })
    const userEmail = user?.email || businessProfile?.companyEmail || process.env.EMAIL_USER || 'noreply@sadbhawanabilldesk.com'
    const userName = user?.name || businessProfile?.companyName || 'Sadbhawana BillDesk'
    const currencySymbol =
      invoice.currency === 'INR' ? '₹' : invoice.currency === 'USD' ? '$' : invoice.currency === 'EUR' ? '€' : '₹'

    const formattedAmount = invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    const formattedDueDate = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'N/A'

    const subject = `Invoice ${invoice.invoiceNumber} from ${companyName} — ${currencySymbol}${formattedAmount}`

    // Build beautiful HTML email
    const html = buildInvoiceEmailHtml({
      companyName,
      customerName: invoice.billToName || 'Valued Customer',
      invoiceNumber: invoice.invoiceNumber,
      amount: formattedAmount,
      dueDate: formattedDueDate,
      currency: invoice.currency,
      message,
      items: invoice.items,
    })

    const plainText = `
Invoice ${invoice.invoiceNumber} from ${companyName}

Dear ${invoice.billToName || 'Valued Customer'},

Please find the details for invoice ${invoice.invoiceNumber}:
Amount Due: ${currencySymbol}${formattedAmount}
Due Date: ${formattedDueDate}

${message ? `Note: ${message}\n` : ''}
Thank you for your business!
${companyName}
    `.trim()

    // Send the email (if configured)
    let emailSent = false
    let emailError = ''

    if (isEmailConfigured()) {
      const result = await sendEmail({
        to: email,
        subject,
        html,
        text: plainText,
        from: `"${userName}" <${process.env.EMAIL_USER}>`,
        replyTo: userEmail,
      })
      emailSent = result.success
      if (!result.success) emailError = result.error || 'Unknown error'
    } else {
      emailError = 'Email not configured — add EMAIL_USER and EMAIL_PASS to .env'
      console.warn('[Share] ' + emailError)
    }

    // Update invoice status to 'sent' if it was draft
    if (invoice.status === 'draft') {
      await db.invoice.update({ where: { id: invoiceId }, data: { status: 'sent' } })
    }

    // Create in-app notification
    await createNotification({
      userId,
      type: 'invoice_sent',
      title: `Invoice ${invoice.invoiceNumber} shared`,
      message: `Sent to ${email}${emailSent ? ' ✓ Email delivered' : ' (email not configured)'}`,
      entityId: invoiceId,
      entityType: 'invoice',
    })

    // Log activity
    await logActivity({
      userId,
      action: 'shared',
      entityType: 'invoice',
      entityId: invoiceId,
      description: `Shared invoice ${invoice.invoiceNumber} via email to ${email}`,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        sharedWithEmail: email,
        grandTotal: invoice.grandTotal,
        currency: invoice.currency,
        emailSent,
        emailError,
      },
    })

    return NextResponse.json({
      success: true,
      email,
      emailSent,
      emailError: emailSent ? undefined : emailError,
      invoiceNumber: invoice.invoiceNumber,
      companyName,
      note: !isEmailConfigured()
        ? 'Email was not sent — configure EMAIL_USER and EMAIL_PASS in .env to enable sending'
        : undefined,
    })
  } catch (error) {
    console.error('Invoice share error:', error)
    return NextResponse.json(
      { error: 'Failed to share invoice. Please try again.' },
      { status: 500 }
    )
  }
}
