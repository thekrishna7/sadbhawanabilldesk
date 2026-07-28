import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

let isTableChecked = false

async function ensureInventoryTable() {
  if (isTableChecked) return
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InventoryItem" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL DEFAULT '',
        "sku" TEXT NOT NULL DEFAULT '',
        "hsnCode" TEXT NOT NULL DEFAULT '',
        "unit" TEXT NOT NULL DEFAULT 'Pcs',
        "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "purchaseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 18,
        "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "description" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "InventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    isTableChecked = true
  } catch (err) {
    console.warn('[INVENTORY_TABLE_CREATE_WARN]', err)
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureInventoryTable()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')
    const filter = searchParams.get('filter') // 'all', 'low_stock', 'out_of_stock'



    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { hsnCode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const allItems = await db.inventoryItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    // Calculate Summary Stats
    const totalItems = allItems.length
    const totalStockValue = allItems.reduce((acc, item) => acc + (item.stock * item.rate), 0)
    const lowStockCount = allItems.filter(item => item.stock > 0 && item.stock <= item.minStock).length
    const outOfStockCount = allItems.filter(item => item.stock <= 0).length

    // Filter items if specified
    let filteredItems = allItems
    if (filter === 'low_stock') {
      filteredItems = allItems.filter(item => item.stock > 0 && item.stock <= item.minStock)
    } else if (filter === 'out_of_stock') {
      filteredItems = allItems.filter(item => item.stock <= 0)
    }

    return NextResponse.json({
      items: filteredItems,
      stats: {
        totalItems,
        totalStockValue,
        lowStockCount,
        outOfStockCount,
      },
    })
  } catch (error: any) {
    console.error('[INVENTORY_GET_ERROR]', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch inventory items' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureInventoryTable()
    const data = await req.json()
    const {
      userId,
      name,
      sku = '',
      hsnCode = '',
      unit = 'Pcs',
      rate = 0,
      purchaseRate = 0,
      taxPercent = 18,
      stock = 0,
      minStock = 5,
      description = '',
    } = data

    if (!userId || !name?.trim()) {
      return NextResponse.json({ error: 'userId and name are required' }, { status: 400 })
    }

    // Verify user exists in database to prevent foreign key failure
    const userExists = await db.user.findUnique({ where: { id: userId } })
    if (!userExists) {
      return NextResponse.json({ error: 'User account not found. Please log out and log in again.' }, { status: 400 })
    }

    const item = await db.inventoryItem.create({
      data: {
        userId,
        name: name.trim(),
        sku: sku.trim(),
        hsnCode: hsnCode.trim(),
        unit: unit.trim() || 'Pcs',
        rate: Number(rate) || 0,
        purchaseRate: Number(purchaseRate) || 0,
        taxPercent: Number(taxPercent) || 0,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        description: description.trim(),
      },
    })

    return NextResponse.json({ item })
  } catch (error: any) {
    console.error('[INVENTORY_POST_ERROR]', error)
    const errorMsg = error?.message || 'Failed to create inventory item'
    return NextResponse.json({ error: errorMsg, details: error }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, userId, ...updates } = data

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await db.inventoryItem.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    const item = await db.inventoryItem.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name.trim() }),
        ...(updates.sku !== undefined && { sku: updates.sku.trim() }),
        ...(updates.hsnCode !== undefined && { hsnCode: updates.hsnCode.trim() }),
        ...(updates.unit !== undefined && { unit: updates.unit.trim() }),
        ...(updates.rate !== undefined && { rate: Number(updates.rate) }),
        ...(updates.purchaseRate !== undefined && { purchaseRate: Number(updates.purchaseRate) }),
        ...(updates.taxPercent !== undefined && { taxPercent: Number(updates.taxPercent) }),
        ...(updates.stock !== undefined && { stock: Number(updates.stock) }),
        ...(updates.minStock !== undefined && { minStock: Number(updates.minStock) }),
        ...(updates.description !== undefined && { description: updates.description.trim() }),
      },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('[INVENTORY_PUT_ERROR]', error)
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    const existing = await db.inventoryItem.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    await db.inventoryItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[INVENTORY_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
  }
}
