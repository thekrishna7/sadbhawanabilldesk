import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const recurringInvoices = await db.recurringInvoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ recurringInvoices })
  } catch (error) {
    console.error('Recurring invoices fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch recurring invoices' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, ...recurringData } = data

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const recurringInvoice = await db.recurringInvoice.create({
      data: {
        userId,
        templateName: recurringData.templateName || '',
        frequency: recurringData.frequency || 'monthly',
        nextDate: recurringData.nextDate || new Date().toISOString().split('T')[0],
        isActive: true,
        billToName: recurringData.billToName || '',
        billToPhone: recurringData.billToPhone || '',
        billToEmail: recurringData.billToEmail || '',
        billToAddress: recurringData.billToAddress || '',
        currency: recurringData.currency || 'INR',
        items: typeof recurringData.items === 'string' ? recurringData.items : JSON.stringify(recurringData.items || []),
        termsText: recurringData.termsText || '',
      },
    })

    return NextResponse.json({ recurringInvoice })
  } catch (error) {
    console.error('Recurring invoice create error:', error)
    return NextResponse.json({ error: 'Failed to create recurring invoice' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // If items is an array, stringify it
    if (updateData.items && typeof updateData.items !== 'string') {
      updateData.items = JSON.stringify(updateData.items)
    }

    const recurringInvoice = await db.recurringInvoice.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ recurringInvoice })
  } catch (error) {
    console.error('Recurring invoice update error:', error)
    return NextResponse.json({ error: 'Failed to update recurring invoice' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Soft delete - set isActive to false
    const recurringInvoice = await db.recurringInvoice.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ recurringInvoice })
  } catch (error) {
    console.error('Recurring invoice delete error:', error)
    return NextResponse.json({ error: 'Failed to delete recurring invoice' }, { status: 500 })
  }
}
