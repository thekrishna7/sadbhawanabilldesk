import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const terms = await db.termsCondition.findMany({
      where: { userId },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ terms })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, text, order } = data

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const term = await db.termsCondition.create({
      data: { userId, text, order: order || 0 }
    })

    return NextResponse.json({ term })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create term' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { terms } = data

    if (!terms || !Array.isArray(terms)) {
      return NextResponse.json({ error: 'terms array is required' }, { status: 400 })
    }

    for (const term of terms) {
      if (term.id) {
        await db.termsCondition.update({
          where: { id: term.id },
          data: { text: term.text, order: term.order }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update terms' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Term ID is required' }, { status: 400 })
    }

    await db.termsCondition.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete term' }, { status: 500 })
  }
}
