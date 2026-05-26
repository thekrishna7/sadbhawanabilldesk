import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activityLogger'

export async function POST(req: NextRequest) {
  try {
    const { action, ids, userId } = await req.json()

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0 || !userId) {
      return NextResponse.json(
        { error: 'action, ids (non-empty array), and userId are required' },
        { status: 400 }
      )
    }

    const validActions = ['delete', 'markSent', 'markPaid']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify all invoices belong to the user
    const invoices = await db.invoice.findMany({
      where: { id: { in: ids }, userId },
    })

    if (invoices.length === 0) {
      return NextResponse.json({ error: 'No matching invoices found' }, { status: 404 })
    }

    const foundIds = invoices.map((inv) => inv.id)
    const notFoundIds = ids.filter((id: string) => !foundIds.includes(id))

    let result

    switch (action) {
      case 'delete': {
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

        result = await db.invoice.updateMany({
          where: { id: { in: foundIds } },
          data: {
            deletedAt: new Date(),
            permanentDeleteAt: sevenDaysFromNow,
            status: 'deleted',
          },
        })

        // Log activity for each deleted invoice
        for (const inv of invoices) {
          await logActivity({
            userId,
            action: 'deleted',
            entityType: 'invoice',
            entityId: inv.id,
            description: `Deleted invoice ${inv.invoiceNumber}`,
            metadata: {
              invoiceNumber: inv.invoiceNumber,
              bulkAction: true,
            },
          })
        }
        break
      }

      case 'markSent': {
        // Only update non-deleted invoices
        const eligibleInvoices = invoices.filter((inv) => inv.status !== 'deleted')
        const eligibleIds = eligibleInvoices.map((inv) => inv.id)

        if (eligibleIds.length === 0) {
          return NextResponse.json(
            { error: 'No eligible invoices to mark as sent' },
            { status: 400 }
          )
        }

        result = await db.invoice.updateMany({
          where: { id: { in: eligibleIds } },
          data: { status: 'sent' },
        })

        // Log activity for each updated invoice
        for (const inv of eligibleInvoices) {
          await logActivity({
            userId,
            action: 'sent',
            entityType: 'invoice',
            entityId: inv.id,
            description: `Marked invoice ${inv.invoiceNumber} as sent`,
            metadata: {
              invoiceNumber: inv.invoiceNumber,
              bulkAction: true,
            },
          })
        }
        break
      }

      case 'markPaid': {
        // Only update non-deleted invoices
        const eligibleInvoices = invoices.filter((inv) => inv.status !== 'deleted')
        const eligibleIds = eligibleInvoices.map((inv) => inv.id)

        if (eligibleIds.length === 0) {
          return NextResponse.json(
            { error: 'No eligible invoices to mark as paid' },
            { status: 400 }
          )
        }

        result = await db.invoice.updateMany({
          where: { id: { in: eligibleIds } },
          data: { status: 'paid' },
        })

        // Log activity for each updated invoice
        for (const inv of eligibleInvoices) {
          await logActivity({
            userId,
            action: 'paid',
            entityType: 'invoice',
            entityId: inv.id,
            description: `Marked invoice ${inv.invoiceNumber} as paid`,
            metadata: {
              invoiceNumber: inv.invoiceNumber,
              bulkAction: true,
            },
          })
        }
        break
      }
    }

    return NextResponse.json({
      success: true,
      action,
      affectedCount: result?.count || 0,
      notFoundIds: notFoundIds.length > 0 ? notFoundIds : undefined,
    })
  } catch (error) {
    console.error('Bulk invoice action error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
  }
}
