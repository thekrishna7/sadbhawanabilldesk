'use client'

import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Package, Plus, Check, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface InventoryItemData {
  id: string
  name: string
  sku: string
  hsnCode: string
  unit: string
  rate: number
  purchaseRate: number
  taxPercent: number
  stock: number
  minStock: number
  description: string
}

export interface InvoiceItemForm {
  description: string
  quantity: number
  rate: number
  taxPercent: number
  amount: number
}

interface InventoryPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectItems: (items: InvoiceItemForm[]) => void
}

export default function InventoryPickerModal({
  open,
  onOpenChange,
  onSelectItems,
}: InventoryPickerModalProps) {
  const { user } = useAppStore()
  const [items, setItems] = useState<InventoryItemData[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    if (open && user?.id) {
      fetchInventory()
    } else {
      setSelectedItemIds(new Set())
      setItemQuantities({})
      setSearch('')
    }
  }, [open, user?.id])

  const fetchInventory = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/inventory?userId=${user.id}`)
      const data = await res.json()
      if (res.ok && data.items) {
        setItems(data.items)
      } else {
        toast.error('Failed to load inventory')
      }
    } catch {
      toast.error('Failed to load inventory items')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedItemIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
      if (!itemQuantities[id]) {
        setItemQuantities(prev => ({ ...prev, [id]: 1 }))
      }
    }
    setSelectedItemIds(next)
  }

  const handleQuantityChange = (id: string, qty: number) => {
    const validQty = Math.max(1, qty || 1)
    setItemQuantities(prev => ({ ...prev, [id]: validQty }))
  }

  const handleAddSingle = (item: InventoryItemData) => {
    const qty = itemQuantities[item.id] || 1
    const desc = item.hsnCode ? `${item.name} (HSN: ${item.hsnCode})` : item.name
    const invoiceItem: InvoiceItemForm = {
      description: desc,
      quantity: qty,
      rate: item.rate,
      taxPercent: item.taxPercent,
      amount: Math.round((qty * item.rate * (1 + item.taxPercent / 100)) * 100) / 100,
    }

    onSelectItems([invoiceItem])
    toast.success(`Added "${item.name}" to invoice!`)
    onOpenChange(false)
  }

  const handleAddSelectedBulk = () => {
    if (selectedItemIds.size === 0) return

    const selectedItemsList: InvoiceItemForm[] = []

    items.forEach(item => {
      if (selectedItemIds.has(item.id)) {
        const qty = itemQuantities[item.id] || 1
        const desc = item.hsnCode ? `${item.name} (HSN: ${item.hsnCode})` : item.name
        selectedItemsList.push({
          description: desc,
          quantity: qty,
          rate: item.rate,
          taxPercent: item.taxPercent,
          amount: Math.round((qty * item.rate * (1 + item.taxPercent / 100)) * 100) / 100,
        })
      }
    })

    onSelectItems(selectedItemsList)
    toast.success(`Added ${selectedItemsList.length} items to invoice!`)
    onOpenChange(false)
  }

  const filteredItems = items.filter(item => {
    const q = search.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.hsnCode.toLowerCase().includes(q)
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Select Items from Inventory
          </DialogTitle>
          <DialogDescription>
            Choose saved items to quickly populate invoice line items with rates, tax, and HSN codes.
          </DialogDescription>
        </DialogHeader>

        {/* Search bar */}
        <div className="pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Item Name, SKU, or HSN Code..."
              className="pl-9 h-10"
              autoFocus
            />
          </div>
        </div>

        {/* Inventory Item List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 my-2 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-muted-foreground">Loading inventory items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-xl text-center p-6">
              <Package className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
              <p className="font-semibold text-base">No inventory items found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {search ? 'Try searching with a different term' : 'You have not added any items to your inventory yet. Go to Inventory section to add items.'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isSelected = selectedItemIds.has(item.id)
              const qty = itemQuantities[item.id] || 1
              const isOutOfStock = item.stock <= 0
              const isLowStock = item.stock > 0 && item.stock <= item.minStock

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm'
                      : 'border-border/60 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-muted/30'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      className={`size-5 rounded border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-muted-foreground/40 hover:border-emerald-500'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{item.name}</span>
                        {item.sku && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                            SKU: {item.sku}
                          </Badge>
                        )}
                        {item.hsnCode && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-mono">
                            HSN: {item.hsnCode}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>Rate: <strong className="text-foreground">₹{item.rate.toLocaleString('en-IN')}</strong> / {item.unit}</span>
                        <span>•</span>
                        <span>GST Tax: <strong className="text-foreground">{item.taxPercent}%</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                              <XCircle className="h-3 w-3" /> Out of Stock ({item.stock})
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                              <AlertTriangle className="h-3 w-3" /> Low Stock ({item.stock} {item.unit})
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Stock: {item.stock} {item.unit}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity & Add Button */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground font-medium">Qty:</span>
                      <Input
                        type="number"
                        min="1"
                        value={qty}
                        onChange={e => handleQuantityChange(item.id, parseInt(e.target.value, 10))}
                        className="w-16 h-8 text-center text-xs"
                      />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => handleAddSingle(item)}
                      className={
                        isSelected
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs'
                          : 'border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 h-8 text-xs'
                      }
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {selectedItemIds.size} item(s) selected
          </span>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={selectedItemIds.size === 0}
              onClick={handleAddSelectedBulk}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Add Selected ({selectedItemIds.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
