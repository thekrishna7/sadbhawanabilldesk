'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  Search,
  Plus,
  Users,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Check,
  FileSpreadsheet,
  Printer,
  Download,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/appStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

interface Customer {
  id: string
  userId: string
  name: string
  phone: string
  email: string
  address: string
  createdAt: string
  updatedAt: string
  _count?: { invoices: number }
}

interface CustomerFormData {
  name: string
  phone: string
  email: string
  address: string
}

const emptyForm: CustomerFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
}

// ===== Stagger animation variants =====
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

// ===== Avatar Color Palette (emerald/teal/cyan/amber) =====
const AVATAR_COLORS = [
  { bg: 'from-emerald-400 to-emerald-600', text: 'text-white', border: 'border-l-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { bg: 'from-teal-400 to-teal-600', text: 'text-white', border: 'border-l-teal-500', light: 'bg-teal-50 dark:bg-teal-950/30' },
  { bg: 'from-cyan-400 to-cyan-600', text: 'text-white', border: 'border-l-cyan-500', light: 'bg-cyan-50 dark:bg-cyan-950/30' },
  { bg: 'from-amber-400 to-amber-600', text: 'text-white', border: 'border-l-amber-500', light: 'bg-amber-50 dark:bg-amber-950/30' },
  { bg: 'from-emerald-500 to-teal-500', text: 'text-white', border: 'border-l-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { bg: 'from-teal-500 to-cyan-500', text: 'text-white', border: 'border-l-teal-500', light: 'bg-teal-50 dark:bg-teal-950/30' },
  { bg: 'from-cyan-500 to-emerald-500', text: 'text-white', border: 'border-l-cyan-500', light: 'bg-cyan-50 dark:bg-cyan-950/30' },
  { bg: 'from-amber-500 to-emerald-500', text: 'text-white', border: 'border-l-amber-500', light: 'bg-amber-50 dark:bg-amber-950/30' },
]

function hashNameToColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function CustomersPage() {
  const { user } = useAppStore()
  const userId = user?.id || ''

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)

  // Customer Statement state
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null)
  const [statementData, setStatementData] = useState<{
    customer: { id: string; name: string; email: string; phone: string; address: string }
    statementItems: { id: string; invoiceNumber: string; invoiceDate: string; amount: number; paid: number; balance: number; status: string }[]
    totalInvoiced: number
    totalPaid: number
    outstandingBalance: number
  } | null>(null)
  const [statementLoading, setStatementLoading] = useState(false)
  const [statementStart, setStatementStart] = useState('')
  const [statementEnd, setStatementEnd] = useState('')

  const fetchCustomers = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const params = new URLSearchParams({ userId })
      if (search) params.set('search', search)
      const res = await fetch(`/api/customers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
      }
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [userId, search])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleAddCustomer = async () => {
    if (!formData.name.trim()) {
      toast.error('Customer name is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...formData }),
      })
      if (res.ok) {
        toast.success('Customer added')
        setShowAddDialog(false)
        setFormData(emptyForm)
        fetchCustomers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to add customer')
      }
    } catch {
      toast.error('Failed to add customer')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCustomer = async (id: string) => {
    if (!formData.name.trim()) {
      toast.error('Customer name is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/customers/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...formData }),
      })
      if (res.ok) {
        toast.success('Customer updated')
        setEditingId(null)
        setFormData(emptyForm)
        fetchCustomers()
      } else {
        toast.error('Failed to update customer')
      }
    } catch {
      toast.error('Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/update?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Customer deleted')
        setShowDeleteDialog(null)
        fetchCustomers()
      } else {
        toast.error('Failed to delete customer')
      }
    } catch {
      toast.error('Failed to delete customer')
    }
  }

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData(emptyForm)
  }

  const openStatement = async (customer: Customer) => {
    setStatementCustomer(customer)
    setStatementStart('')
    setStatementEnd('')
    setStatementLoading(true)
    try {
      const params = new URLSearchParams({ userId, customerId: customer.id })
      const res = await fetch(`/api/customers/statement?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStatementData(data)
      } else {
        toast.error('Failed to load statement')
      }
    } catch {
      toast.error('Failed to load statement')
    } finally {
      setStatementLoading(false)
    }
  }

  const fetchStatement = async (customerId: string, start: string, end: string) => {
    setStatementLoading(true)
    try {
      const params = new URLSearchParams({ userId, customerId })
      if (start) params.set('startDate', start)
      if (end) params.set('endDate', end)
      const res = await fetch(`/api/customers/statement?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStatementData(data)
      }
    } catch {
      toast.error('Failed to load statement')
    } finally {
      setStatementLoading(false)
    }
  }

  const exportStatementCSV = () => {
    if (!statementData || !statementCustomer) return
    const headers = ['Date', 'Invoice #', 'Amount', 'Paid', 'Balance']
    const rows = statementData.statementItems.map((item) => [
      item.invoiceDate,
      item.invoiceNumber,
      item.amount.toFixed(2),
      item.paid.toFixed(2),
      item.balance.toFixed(2),
    ])
    const csvContent = [
      `Customer Statement - ${statementCustomer.name}`,
      `Generated on ${new Date().toLocaleDateString()}`,
      '',
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      '',
      `"Total Invoiced",${statementData.totalInvoiced.toFixed(2)}`,
      `"Total Paid",${statementData.totalPaid.toFixed(2)}`,
      `"Outstanding Balance",${statementData.outstandingBalance.toFixed(2)}`,
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `statement-${statementCustomer.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success('Statement exported as CSV')
  }

  // Filter customers based on search (client-side as well for instant feedback)
  const filteredCustomers = customers.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 animate-fade-in"
    >
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-sm">
        <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute bottom-0 left-1/4 size-16 rounded-full bg-white/10 blur-lg" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6" />
              Customers
            </h1>
            <p className="text-white/80 mt-1">
              Manage your customer database
            </p>
          </div>
          <Button
            onClick={() => {
              setFormData(emptyForm)
              setShowAddDialog(true)
            }}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name, email, phone..."
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Customer list */}
      <AnimatePresence mode="wait">
        {filteredCustomers.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="rounded-xl shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="size-28 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                    <Users className="size-14 text-emerald-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 size-8 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center animate-float">
                    <UserPlus className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {search ? 'No customers found' : 'No customers yet'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm text-center mb-6">
                  {search
                    ? 'Try a different search term'
                    : 'Add your first customer to start creating invoices and tracking relationships.'}
                </p>
                {!search && (
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-xl px-6"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Customer
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile card layout */}
                <div className="sm:hidden divide-y divide-border">
                  <AnimatePresence>
                    {filteredCustomers.map((customer, index) => {
                      const color = hashNameToColor(customer.name)
                      const initials = getInitials(customer.name)
                      return (
                        <motion.div
                          key={customer.id}
                          variants={itemVariants}
                          className={`p-4 space-y-3 border-l-4 ${color.border} hover-lift cursor-default`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center size-10 rounded-xl bg-gradient-to-br ${color.bg} ${color.text} font-bold text-sm shrink-0 shadow-sm`}>
                                {initials}
                              </div>
                              <div>
                                <h3 className="font-medium">{customer.name}</h3>
                                {customer.email && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Mail className="h-3 w-3" />
                                    {customer.email}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => startEdit(customer)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                onClick={() => openStatement(customer)}
                                title="View Statement"
                              >
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setShowDeleteDialog(customer.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {customer.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </p>
                          )}
                          {customer.address && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {customer.address}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <FileText className="h-3 w-3 mr-1" />
                              {customer._count?.invoices || 0} invoices
                            </Badge>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>

                {/* Desktop table layout */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-center">Invoices</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredCustomers.map((customer) => {
                          const color = hashNameToColor(customer.name)
                          const initials = getInitials(customer.name)
                          return (
                            <motion.tr
                              key={customer.id}
                              variants={itemVariants}
                              initial="hidden"
                              animate="show"
                              exit={{ opacity: 0, x: -10 }}
                              className={`border-b border-border hover:bg-muted/50 transition-all duration-200 border-l-4 ${color.border}`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={`flex items-center justify-center size-9 rounded-lg bg-gradient-to-br ${color.bg} ${color.text} font-bold text-xs shrink-0 shadow-sm`}>
                                    {initials}
                                  </div>
                                  <span className="font-medium">{customer.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {customer.email || '-'}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {customer.phone || '-'}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px] truncate">
                                {customer.address || '-'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  {customer._count?.invoices || 0}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => startEdit(customer)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                    onClick={() => openStatement(customer)}
                                    title="View Statement"
                                  >
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => setShowDeleteDialog(customer.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to your database
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="custName">Name *</Label>
              <Input
                id="custName"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Customer name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custEmail">Email</Label>
                <Input
                  id="custEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="customer@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custPhone">Phone</Label>
                <Input
                  id="custPhone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custAddress">Address</Label>
              <Input
                id="custAddress"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Customer address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCustomer}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={!!editingId} onOpenChange={() => cancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editName">Name *</Label>
              <Input
                id="editName"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Customer name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="customer@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAddress">Address</Label>
              <Input
                id="editAddress"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Customer address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button
              onClick={() => editingId && handleUpdateCustomer(editingId)}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Statement Dialog */}
      <Dialog open={!!statementCustomer} onOpenChange={() => setStatementCustomer(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Customer Statement
            </DialogTitle>
            <DialogDescription>
              {statementCustomer?.name} — Account summary
            </DialogDescription>
          </DialogHeader>
          {statementLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : statementData ? (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-1">
                <p className="font-semibold">{statementData.customer.name}</p>
                {statementData.customer.email && <p className="text-sm text-muted-foreground">{statementData.customer.email}</p>}
                {statementData.customer.phone && <p className="text-sm text-muted-foreground">{statementData.customer.phone}</p>}
                {statementData.customer.address && <p className="text-sm text-muted-foreground">{statementData.customer.address}</p>}
              </div>

              {/* Date Range Filter */}
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={statementStart}
                    onChange={(e) => {
                      setStatementStart(e.target.value)
                      if (statementCustomer) fetchStatement(statementCustomer.id, e.target.value, statementEnd)
                    }}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={statementEnd}
                    onChange={(e) => {
                      setStatementEnd(e.target.value)
                      if (statementCustomer) fetchStatement(statementCustomer.id, statementStart, e.target.value)
                    }}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-l-4 border-l-emerald-500 rounded-xl shadow-sm">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Total Invoiced</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ₹{statementData.totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-teal-500 rounded-xl shadow-sm">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="text-lg font-bold text-teal-600">
                      ₹{statementData.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 rounded-xl shadow-sm">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="text-lg font-bold text-amber-600">
                      ₹{statementData.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Statement Table */}
              {statementData.statementItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="size-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm">No invoices found for this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Invoice #</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Amount</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Paid</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementData.statementItems.map((item) => (
                        <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-3 text-sm">{item.invoiceDate}</td>
                          <td className="py-2 px-3 text-sm font-medium">{item.invoiceNumber}</td>
                          <td className="py-2 px-3 text-sm text-right">₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-3 text-sm text-right text-teal-600">₹{item.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-3 text-sm text-right font-semibold text-amber-600">₹{item.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 rounded-xl">
                  <Printer className="h-3.5 w-3.5" />
                  Print Statement
                </Button>
                <Button size="sm" onClick={exportStatementCSV} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No statement data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!showDeleteDialog}
        onOpenChange={() => setShowDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot
              be undone. Any invoices linked to this customer will remain but
              will lose the customer association.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteDialog && handleDeleteCustomer(showDeleteDialog)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
