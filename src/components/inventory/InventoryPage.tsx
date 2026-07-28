'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/appStore'
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Boxes,
  Edit2,
  Trash2,
  Loader2,
  RefreshCw,
  IndianRupee,
  CheckCircle2,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface InventoryItem {
  id: string
  userId: string
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
  createdAt: string
  updatedAt: string
}

interface InventoryStats {
  totalItems: number
  totalStockValue: number
  lowStockCount: number
  outOfStockCount: number
}

const UNIT_OPTIONS = ['Pcs', 'Box', 'Kg', 'Copy', 'Set', 'Meter', 'Litre', 'Packet', 'Gram', 'Pair', 'Dozen']
const TAX_PRESETS = [0, 5, 12, 18, 28]

export default function InventoryPage() {
  const { user } = useAppStore()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all')

  // Modal Dialog States
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form Fields
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [hsnCode, setHsnCode] = useState('')
  const [unit, setUnit] = useState('Pcs')
  const [rate, setRate] = useState<string>('')
  const [purchaseRate, setPurchaseRate] = useState<string>('')
  const [taxPercent, setTaxPercent] = useState<string>('18')
  const [stock, setStock] = useState<string>('0')
  const [minStock, setMinStock] = useState<string>('5')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetchInventory()
    }
  }, [user?.id, filter])

  const fetchInventory = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        userId: user.id,
        filter: filter,
      })
      if (search) queryParams.set('search', search)

      const res = await fetch(`/api/inventory?${queryParams.toString()}`)
      const data = await res.json()

      if (res.ok) {
        setItems(data.items || [])
        if (data.stats) setStats(data.stats)
      } else {
        toast.error('Failed to load inventory')
      }
    } catch {
      toast.error('Error fetching inventory items')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setName('')
    setSku('')
    setHsnCode('')
    setUnit('Pcs')
    setRate('')
    setPurchaseRate('')
    setTaxPercent('18')
    setStock('0')
    setMinStock('5')
    setDescription('')
    setShowItemModal(true)
  }

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item)
    setName(item.name)
    setSku(item.sku || '')
    setHsnCode(item.hsnCode || '')
    setUnit(item.unit || 'Pcs')
    setRate(item.rate.toString())
    setPurchaseRate(item.purchaseRate ? item.purchaseRate.toString() : '')
    setTaxPercent(item.taxPercent.toString())
    setStock(item.stock.toString())
    setMinStock(item.minStock.toString())
    setDescription(item.description || '')
    setShowItemModal(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    if (!name.trim()) {
      toast.error('Item name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        userId: user.id,
        name: name.trim(),
        sku: sku.trim(),
        hsnCode: hsnCode.trim(),
        unit: unit.trim() || 'Pcs',
        rate: parseFloat(rate) || 0,
        purchaseRate: parseFloat(purchaseRate) || 0,
        taxPercent: parseFloat(taxPercent) || 0,
        stock: parseFloat(stock) || 0,
        minStock: parseFloat(minStock) || 0,
        description: description.trim(),
      }

      let res: Response
      if (editingItem) {
        res = await fetch('/api/inventory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        })
      } else {
        res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const result = await res.json()
      if (res.ok) {
        toast.success(editingItem ? 'Item updated successfully!' : 'Item added to inventory!')
        setShowItemModal(false)
        fetchInventory()
      } else {
        toast.error(result.error || 'Failed to save inventory item')
      }
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred while saving item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteItemId || !user?.id) return

    try {
      const res = await fetch(`/api/inventory?id=${deleteItemId}&userId=${user.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Inventory item deleted')
        fetchInventory()
      } else {
        toast.error('Failed to delete item')
      }
    } catch {
      toast.error('Error deleting inventory item')
    } finally {
      setDeleteItemId(null)
    }
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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Package className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Inventory & Stock Master
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your product catalog, track live stock counts, GST tax rates, and prices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInventory}
            className="border-emerald-200 dark:border-emerald-800"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>

          <Button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add New Item
          </Button>
        </div>
      </div>

      {/* Stats Cards Cockpit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Items</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{stats.totalItems}</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Active in catalog
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Boxes className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Valuation</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">
                ₹{stats.totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Total stock worth
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <IndianRupee className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{stats.lowStockCount}</h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Re-order threshold reached
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-500/20 bg-gradient-to-br from-rose-50/50 to-pink-50/30 dark:from-rose-950/20 dark:to-pink-950/10 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Out of Stock</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">{stats.outOfStockCount}</h3>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Zero quantity remaining
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-rose-600/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action & Filter Toolbar */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Live Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Item Name, SKU, or HSN..."
              className="pl-9 h-10"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            >
              All Items ({stats.totalItems})
            </Button>
            <Button
              variant={filter === 'low_stock' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('low_stock')}
              className={filter === 'low_stock' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
            >
              Low Stock ({stats.lowStockCount})
            </Button>
            <Button
              variant={filter === 'out_of_stock' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('out_of_stock')}
              className={filter === 'out_of_stock' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
            >
              Out of Stock ({stats.outOfStockCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table View */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-muted-foreground">Loading catalog items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold">No inventory items found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {search ? 'No items match your search query.' : 'Click "Add New Item" to populate your product catalog.'}
              </p>
              {!search && (
                <Button onClick={openCreateModal} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add First Item
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Item Name & SKU</th>
                    <th className="py-3.5 px-4">HSN Code</th>
                    <th className="py-3.5 px-4">Unit</th>
                    <th className="py-3.5 px-4 text-right">Selling Rate</th>
                    <th className="py-3.5 px-4 text-right">Purchase Price</th>
                    <th className="py-3.5 px-4 text-center">GST Tax</th>
                    <th className="py-3.5 px-4 text-center">Stock Quantity</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredItems.map(item => {
                    const isOutOfStock = item.stock <= 0
                    const isLowStock = item.stock > 0 && item.stock <= item.minStock

                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground">{item.name}</div>
                          {item.sku && (
                            <span className="text-[11px] text-muted-foreground font-mono">SKU: {item.sku}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                          {item.hsnCode || '—'}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="text-xs">
                            {item.unit}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-foreground">
                          ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 text-right text-muted-foreground">
                          {item.purchaseRate > 0 ? `₹${item.purchaseRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Badge variant="secondary" className="font-semibold">
                            {item.taxPercent}% GST
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isOutOfStock ? (
                            <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100">
                              <XCircle className="h-3 w-3 mr-1" /> Out of Stock ({item.stock})
                            </Badge>
                          ) : isLowStock ? (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Low Stock ({item.stock} {item.unit})
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100">
                              In Stock ({item.stock} {item.unit})
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(item)}
                              className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteItemId(item.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog: Add / Edit Item */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </DialogTitle>
            <DialogDescription>
              Enter the item details for quick billing and stock tracking.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveItem} className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Item Name *</Label>
              <Input
                id="item-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Physics Textbook Class 12"
                required
              />
            </div>

            {/* SKU & HSN Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-sku">SKU / Product Code</Label>
                <Input
                  id="item-sku"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder="e.g. PHY-12-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-hsn">HSN / SAC Code</Label>
                <Input
                  id="item-hsn"
                  value={hsnCode}
                  onChange={e => setHsnCode(e.target.value)}
                  placeholder="e.g. 49011010"
                />
              </div>
            </div>

            {/* Rates & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-rate">Selling Price (₹) *</Label>
                <Input
                  id="item-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-purchase">Purchase Cost (₹)</Label>
                <Input
                  id="item-purchase"
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchaseRate}
                  onChange={e => setPurchaseRate(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-unit">Measuring Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger id="item-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tax Rate % */}
            <div className="space-y-1.5">
              <Label>GST Tax Rate (%)</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {TAX_PRESETS.map(tax => (
                  <Button
                    key={tax}
                    type="button"
                    variant={taxPercent === tax.toString() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTaxPercent(tax.toString())}
                    className={taxPercent === tax.toString() ? 'bg-emerald-600 text-white' : 'h-8 text-xs'}
                  >
                    {tax}%
                  </Button>
                ))}
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={taxPercent}
                  onChange={e => setTaxPercent(e.target.value)}
                  placeholder="Custom %"
                  className="w-24 h-8 text-xs text-center"
                />
              </div>
            </div>

            {/* Stock Quantities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-stock">Current Stock Quantity</Label>
                <Input
                  id="item-stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-minstock">Low Stock Alert Limit</Label>
                <Input
                  id="item-minstock"
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={e => setMinStock(e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="item-desc">Description / Notes</Label>
              <Textarea
                id="item-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Additional specifications, author, publisher, etc."
                rows={3}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowItemModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingItem ? 'Update Item' : 'Save Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Alert */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item from your inventory? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-rose-600 hover:bg-rose-700 text-white">
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
