import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activityLogger'

// GET: List payments for an invoice
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get('invoiceId')
    const userId = searchParams.get('userId')

    if (!invoiceId || !userId) {
      return NextResponse.json({ error: 'invoiceId and userId are required' }, { status: 400 })
    }

    // Verify the invoice belongs to the user
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const payments = await db.payment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: 'desc' },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Payment list error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST: Record a payment against an invoice
export async function POST(req: NextRequest) {
  try {
    const { invoiceId, userId, amount, method, reference, note } = await req.json()

    if (!invoiceId || !userId || !amount || !method) {
      return NextResponse.json(
        { error: 'invoiceId, userId, amount, and method are required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    const validMethods = ['cash', 'bank_transfer', 'upi', 'cheque', 'other']
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: `Invalid method. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      )
    }

    // Fetch the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Calculate new received amount and current balance
    const newReceivedAmount = invoice.receivedAmount + amount
    const newCurrentBalance = invoice.grandTotal - newReceivedAmount + invoice.previousBalance

    // Determine if invoice should be marked as paid
    const newStatus = newCurrentBalance <= 0 ? 'paid' : invoice.status

    // Create the payment record and update the invoice in a transaction
    const [payment] = await db.$transaction([
      db.payment.create({
        data: {
          invoiceId,
          userId,
          amount,
          method,
          reference: reference || '',
          note: note || '',
        },
      }),
      db.invoice.update({
        where: { id: invoiceId },
        data: {
          receivedAmount: newReceivedAmount,
          currentBalance: newCurrentBalance,
          status: newStatus,
        },
      }),
    ])

    // Log activity
    await logActivity({
      userId,
      action: 'payment_recorded',
      entityType: 'invoice',
      entityId: invoiceId,
      description: `Recorded payment of ₹${amount.toLocaleString('en-IN')} for ${invoice.invoiceNumber}`,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        paymentAmount: amount,
        paymentMethod: method,
        paymentId: payment.id,
        newReceivedAmount,
        newCurrentBalance,
        autoMarkedPaid: newStatus === 'paid',
      },
    })

    // If auto-marked as paid, log that too
    if (newStatus === 'paid' && invoice.status !== 'paid') {
      await logActivity({
        userId,
        action: 'paid',
        entityType: 'invoice',
        entityId: invoiceId,
        description: `Invoice ${invoice.invoiceNumber} auto-marked as paid after receiving ₹${amount.toLocaleString('en-IN')}`,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          autoTriggered: true,
        },
      })
    }

    return NextResponse.json({
      payment,
      invoiceUpdate: {
        receivedAmount: newReceivedAmount,
        currentBalance: newCurrentBalance,
        status: newStatus,
      },
    })
  } catch (error) {
    console.error('Payment recording error:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}
