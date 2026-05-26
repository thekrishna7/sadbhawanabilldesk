'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Building2,
  Landmark,
  PenTool,
  FileText,
  Camera,
  Upload,
  Loader2,
  GripVertical,
  Plus,
  Trash2,
  Save,
  Check,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/appStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import SealGenerator from './SealGenerator'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Types ────────────────────────────────────────────────────────

interface BusinessProfile {
  id?: string
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  companyWebsite: string
  gstNumber: string
  panNumber: string
  companyLogo: string
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  branchName: string
  qrCode: string
  signatureImage: string
  sealImage: string
  sealCompanyName: string
  sealDetail: string
  useSeal: boolean
}

interface Term {
  id: string
  userId: string
  text: string
  order: number
}

const defaultBusiness: BusinessProfile = {
  companyName: 'Sadbhawana Publication',
  companyAddress: 'Near Rajeev Gandhi School Ambah, Vallabh Colony Ambah, Morena (M.P.)',
  companyPhone: '+91 7987484155',
  companyEmail: 'sadbhawanapublication@gmail.com',
  companyWebsite: '',
  gstNumber: 'GTZPS4321G',
  panNumber: 'GTZPS4321G',
  companyLogo: '/logo.png',
  accountHolderName: 'Sadbhawana Publication',
  bankName: 'Punjab National Bank (PNB), Ambah',
  accountNumber: '0512102100000903',
  ifscCode: 'PUNB0051210',
  branchName: 'Ambah',
  qrCode: '',
  signatureImage: '',
  sealImage: '',
  sealCompanyName: 'Sadbhawana Publication',
  sealDetail: 'Ambah Morena',
  useSeal: false,
}

// ─── Save Button with Confirmation Animation ────────────────────────

function SaveButton({
  onClick,
  saving,
  label = 'Save Details',
}: {
  onClick: () => Promise<void>
  saving: boolean
  label?: string
}) {
  const [showSuccess, setShowSuccess] = useState(false)

  const handleClick = async () => {
    await onClick()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  return (
    <Button
      onClick={handleClick}
      disabled={saving || showSuccess}
      className={cn(
        "gap-2 transition-all duration-300 rounded-xl",
        showSuccess
          ? "bg-emerald-600 hover:bg-emerald-600 text-white"
          : "bg-emerald-600 hover:bg-emerald-700 text-white"
      )}
    >
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <CheckCircle2 className="h-4 w-4" />
          </motion.div>
        ) : saving ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className="h-4 w-4 animate-spin" />
          </motion.div>
        ) : (
          <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Save className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
      {showSuccess ? 'Saved!' : label}
    </Button>
  )
}

// ─── Sortable Term Item ───────────────────────────────────────────

function SortableTermItem({
  term,
  index,
  onUpdate,
  onDelete,
}: {
  term: Term
  index: number
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: term.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 group hover:border-emerald-500/30 transition-colors"
    >
      <button
        className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Badge
        variant="secondary"
        className="mt-1 min-w-[28px] justify-center shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      >
        {index + 1}
      </Badge>
      <Input
        value={term.text}
        onChange={(e) => onUpdate(term.id, e.target.value)}
        className="flex-1 border-transparent hover:border-input focus:border-input bg-transparent"
        placeholder="Enter term..."
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(term.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ─── Helper ────────────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Profile Page ─────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, setUser } = useAppStore()
  const userId = user?.id || ''

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [savingBank, setSavingBank] = useState(false)
  const [savingSignature, setSavingSignature] = useState(false)
  const [savingSeal, setSavingSeal] = useState(false)

  // Personal details
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [profilePhoto, setProfilePhoto] = useState('')

  // Business details
  const [business, setBusiness] = useState<BusinessProfile>(defaultBusiness)

  // Signature & seal
  const [signaturePreview, setSignaturePreview] = useState('')
  const [sealCompanyName, setSealCompanyName] = useState('')
  const [sealDetail, setSealDetail] = useState('')
  const [useSeal, setUseSeal] = useState(false)
  const [sealPreview, setSealPreview] = useState('')

  // Terms
  const [terms, setTerms] = useState<Term[]>([])
  const [deleteTermId, setDeleteTermId] = useState<string | null>(null)

  // File refs
  const profilePhotoRef = useRef<HTMLInputElement>(null)
  const companyLogoRef = useRef<HTMLInputElement>(null)
  const qrCodeRef = useRef<HTMLInputElement>(null)
  const signatureRef = useRef<HTMLInputElement>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ─── Fetch profile data ───────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    if (!userId) return
    try {
      setLoadingProfile(true)
      const res = await fetch(`/api/profile?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setName(data.user.name || '')
          setEmail(data.user.email || '')
          setPhone(data.user.phone || '')
          setProfilePhoto(data.user.profilePhoto || '')
        }
        if (data.businessProfile) {
          const bp = data.businessProfile
          setBusiness({
            ...defaultBusiness,
            ...bp,
          })
          setSignaturePreview(bp.signatureImage || '')
          setSealCompanyName(bp.sealCompanyName || '')
          setSealDetail(bp.sealDetail || '')
          setUseSeal(bp.useSeal || false)
          setSealPreview(bp.sealImage || '')
        }

        // Sync loaded profile details (including avatar and business logo) to global store
        const currentUser = useAppStore.getState().user
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            name: data.user?.name || currentUser.name,
            email: data.user?.email || currentUser.email,
            phone: data.user?.phone || currentUser.phone,
            profilePhoto: data.user?.profilePhoto || undefined,
            companyLogo: data.businessProfile?.companyLogo || undefined,
          }
          if (
            currentUser.name !== updatedUser.name ||
            currentUser.email !== updatedUser.email ||
            currentUser.phone !== updatedUser.phone ||
            currentUser.profilePhoto !== updatedUser.profilePhoto ||
            currentUser.companyLogo !== updatedUser.companyLogo
          ) {
            setUser(updatedUser)
          }
        }
      }
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoadingProfile(false)
    }
  }, [userId, setUser])

  const fetchTerms = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/profile/terms?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setTerms(data.terms || [])
      }
    } catch {
      // silent
    }
  }, [userId])

  useEffect(() => {
    fetchProfile()
    fetchTerms()
  }, [fetchProfile, fetchTerms])

  // ─── File upload helpers ──────────────────────────────────────

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleFileUpload = async (
    file: File,
    setter: (val: string) => void,
    maxSizeMB = 2
  ) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`)
      return
    }
    const base64 = await fileToBase64(file)
    setter(base64)
  }

  // ─── Save handlers ────────────────────────────────────────────

  const savePersonal = async () => {
    if (!userId) return
    setSavingPersonal(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name, email, phone, profilePhoto }),
      })
      if (res.ok) {
        setUser({
          ...user!,
          name,
          email,
          phone,
          profilePhoto,
        })
        toast.success('Personal details saved')
      } else {
        toast.error('Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingPersonal(false)
    }
  }

  const saveBusiness = async () => {
    if (!userId) return
    setSavingBusiness(true)
    try {
      const res = await fetch('/api/profile/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          companyName: business.companyName,
          companyAddress: business.companyAddress,
          companyPhone: business.companyPhone,
          companyEmail: business.companyEmail,
          companyWebsite: business.companyWebsite,
          gstNumber: business.gstNumber,
          panNumber: business.panNumber,
          companyLogo: business.companyLogo,
        }),
      })
      if (res.ok) {
        toast.success('Business details saved')
        if (user) {
          setUser({
            ...user,
            companyLogo: business.companyLogo || undefined
          })
        }
      } else {
        toast.error('Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingBusiness(false)
    }
  }

  const saveBank = async () => {
    if (!userId) return
    setSavingBank(true)
    try {
      const res = await fetch('/api/profile/bank', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          accountHolderName: business.accountHolderName,
          bankName: business.bankName,
          accountNumber: business.accountNumber,
          ifscCode: business.ifscCode,
          branchName: business.branchName,
          qrCode: business.qrCode,
        }),
      })
      if (res.ok) {
        toast.success('Bank details saved')
      } else {
        toast.error('Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingBank(false)
    }
  }

  const saveSignature = async () => {
    if (!userId) return
    setSavingSignature(true)
    try {
      const res = await fetch('/api/profile/signature', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, signatureImage: signaturePreview }),
      })
      if (res.ok) {
        toast.success('Signature saved')
      } else {
        toast.error('Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingSignature(false)
    }
  }

  const saveSeal = async () => {
    if (!userId) return
    setSavingSeal(true)
    try {
      const res = await fetch('/api/profile/seal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sealImage: sealPreview,
          sealCompanyName,
          sealDetail,
          useSeal,
        }),
      })
      if (res.ok) {
        toast.success('Seal settings saved')
      } else {
        toast.error('Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingSeal(false)
    }
  }

  // ─── Terms handlers ──────────────────────────────────────────

  const addTerm = async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/profile/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          text: '',
          order: terms.length,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTerms((prev) => [...prev, data.term])
        toast.success('Term added')
      }
    } catch {
      toast.error('Failed to add term')
    }
  }

  const updateTerm = async (id: string, text: string) => {
    setTerms((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)))
    // Auto-save with debounce
    try {
      await fetch('/api/profile/terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: [{ id, text, order: terms.find((t) => t.id === id)?.order || 0 }] }),
      })
    } catch {
      // silent
    }
  }

  const confirmDeleteTerm = async () => {
    if (!deleteTermId) return
    try {
      const res = await fetch(`/api/profile/terms?id=${deleteTermId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setTerms((prev) => prev.filter((t) => t.id !== deleteTermId))
        toast.success('Term deleted')
      }
    } catch {
      toast.error('Failed to delete term')
    } finally {
      setDeleteTermId(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = terms.findIndex((t) => t.id === active.id)
    const newIndex = terms.findIndex((t) => t.id === over.id)
    const newTerms = arrayMove(terms, oldIndex, newIndex).map((t, i) => ({
      ...t,
      order: i,
    }))
    setTerms(newTerms)

    // Save new order
    try {
      await fetch('/api/profile/terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: newTerms.map((t) => ({ id: t.id, text: t.text, order: t.order })) }),
      })
    } catch {
      // silent
    }
  }

  // ─── Render ────────────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  const initials = getInitials(name || user?.name || 'U')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 animate-fade-in"
    >
      {/* ─── Header Banner with Glassmorphism + Pattern Overlay ────── */}
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-r from-emerald-600/90 via-teal-600/90 to-emerald-700/90 dark:from-emerald-800/90 dark:via-teal-800/90 dark:to-emerald-900/90 p-6 shadow-lg border border-white/20 card-shine">
        {/* Dot grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L2c+PC9zdmc+')] opacity-70" />
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -left-5 -bottom-5 size-32 rounded-full bg-teal-400/20 blur-lg" />
        <div className="absolute right-1/4 top-1/2 size-20 rounded-full bg-emerald-300/10 blur-md" />

        <div className="relative flex items-center gap-5">
          {/* Large initials avatar with hover zoom */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center justify-center size-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg overflow-hidden cursor-pointer"
            onClick={() => profilePhotoRef.current?.click()}
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={name}
                className="size-full object-cover rounded-2xl"
              />
            ) : (
              <span className="text-3xl font-bold text-white">{initials}</span>
            )}
          </motion.div>
          <div className="text-white">
            <h1 className="text-2xl font-bold tracking-tight">{name || 'Profile'}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-emerald-100">
              {email && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Mail className="size-3.5" />
                  <span>{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Phone className="size-3.5" />
                  <span>{phone}</span>
                </div>
              )}
            </div>
            {/* Profile completeness progress - ring/circle style */}
            <div className="flex items-center gap-3 mt-2">
              <div className="relative size-10">
                <svg className="size-10 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/20"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <motion.path
                    className="text-white/80"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="3"
                    strokeDasharray={`${(() => {
                      const fields = [!!name, !!email, !!phone, !!business.companyName, !!business.companyAddress, !!business.bankName]
                      return Math.round((fields.filter(Boolean).length / fields.length) * 100)
                    })()}, 100`}
                    initial={{ strokeDasharray: '0, 100' }}
                    animate={{ strokeDasharray: `${(() => {
                      const fields = [!!name, !!email, !!phone, !!business.companyName, !!business.companyAddress, !!business.bankName]
                      return Math.round((fields.filter(Boolean).length / fields.length) * 100)
                    })()}, 100` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  {(() => {
                    const fields = [!!name, !!email, !!phone, !!business.companyName, !!business.companyAddress, !!business.bankName]
                    return Math.round((fields.filter(Boolean).length / fields.length) * 100)
                  })()}%
                </span>
              </div>
              <p className="text-emerald-200 text-sm">
                Profile completeness
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="personal" className="flex-1 min-w-[120px] gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex-1 min-w-[120px] gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex-1 min-w-[120px] gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">Bank</span>
          </TabsTrigger>
          <TabsTrigger value="signature" className="flex-1 min-w-[120px] gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg">
            <PenTool className="h-4 w-4" />
            <span className="hidden sm:inline">Signature & Seal</span>
          </TabsTrigger>
          <TabsTrigger value="terms" className="flex-1 min-w-[120px] gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Terms</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Personal Details ────────────────────────────────── */}
        <TabsContent value="personal" className="mt-0">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile photo */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 bg-muted">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950">
                        <User className="h-10 w-10 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => profilePhotoRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                  <input
                    ref={profilePhotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        await handleFileUpload(file, setProfilePhoto, 2)
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Click to upload profile photo
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <SaveButton onClick={savePersonal} saving={savingPersonal} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Business Details ────────────────────────────────── */}
        <TabsContent value="business" className="mt-0">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company logo */}
              <div className="flex flex-col items-center gap-4">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => companyLogoRef.current?.click()}
                >
                  <div className="h-20 w-20 rounded-xl overflow-hidden border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-muted flex items-center justify-center">
                    {business.companyLogo ? (
                      <img
                        src={business.companyLogo}
                        alt="Company Logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-emerald-400">
                        <Upload className="h-6 w-6" />
                        <span className="text-[10px]">Logo</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <input
                    ref={companyLogoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const base64 = await fileToBase64(file)
                        setBusiness((prev) => ({
                          ...prev,
                          companyLogo: base64,
                        }))
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Click to upload company logo
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={business.companyName}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">
                    Company Email <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={business.companyEmail}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        companyEmail: e.target.value,
                      }))
                    }
                    placeholder="company@example.com"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Input
                    id="companyAddress"
                    value={business.companyAddress}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        companyAddress: e.target.value,
                      }))
                    }
                    placeholder="Enter company address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">
                    Company Phone <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="companyPhone"
                    value={business.companyPhone}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        companyPhone: e.target.value,
                      }))
                    }
                    placeholder="Enter company phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">
                    Website <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="companyWebsite"
                    value={business.companyWebsite}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        companyWebsite: e.target.value,
                      }))
                    }
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">
                    GST Number <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="gstNumber"
                    value={business.gstNumber}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        gstNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter GST number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panNumber">
                    PAN Number <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="panNumber"
                    value={business.panNumber}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        panNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter PAN number"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <SaveButton onClick={saveBusiness} saving={savingBusiness} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Bank Details ────────────────────────────────────── */}
        <TabsContent value="bank" className="mt-0">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-emerald-600" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    value={business.accountHolderName}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        accountHolderName: e.target.value,
                      }))
                    }
                    placeholder="Enter account holder name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={business.bankName}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        bankName: e.target.value,
                      }))
                    }
                    placeholder="Enter bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={business.accountNumber}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        accountNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={business.ifscCode}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        ifscCode: e.target.value,
                      }))
                    }
                    placeholder="Enter IFSC code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={business.branchName}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        branchName: e.target.value,
                      }))
                    }
                    placeholder="Enter branch name"
                  />
                </div>
              </div>

              {/* QR Code upload */}
              <div className="space-y-3">
                <Label>QR Code</Label>
                <div className="flex items-start gap-4">
                  <div
                    className="relative group cursor-pointer h-32 w-32 rounded-lg border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-muted flex items-center justify-center overflow-hidden"
                    onClick={() => qrCodeRef.current?.click()}
                  >
                    {business.qrCode ? (
                      <img
                        src={business.qrCode}
                        alt="QR Code"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-emerald-400">
                        <Upload className="h-8 w-8" />
                        <span className="text-xs">Upload QR</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                    <input
                      ref={qrCodeRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          await handleFileUpload(file, (val) =>
                            setBusiness((prev) => ({ ...prev, qrCode: val }))
                          )
                        }
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 pt-2">
                    <p>Upload a QR code for UPI payments</p>
                    <p>PNG or JPG format, max 2MB</p>
                    {business.qrCode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          setBusiness((prev) => ({ ...prev, qrCode: '' }))
                        }
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <SaveButton onClick={saveBank} saving={savingBank} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Signature & Seal ────────────────────────────────── */}
        <TabsContent value="signature" className="mt-0">
          <div className="space-y-6">
            {/* Signature */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-emerald-600" />
                  Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div
                    className="relative group cursor-pointer h-24 w-64 rounded-lg border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-muted flex items-center justify-center overflow-hidden"
                    onClick={() => signatureRef.current?.click()}
                  >
                    {signaturePreview ? (
                      <img
                        src={signaturePreview}
                        alt="Signature"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-emerald-400">
                        <Upload className="h-6 w-6" />
                        <span className="text-xs">Upload Signature</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <input
                      ref={signatureRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          await handleFileUpload(file, setSignaturePreview, 2)
                        }
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 pt-2">
                    <p>Upload your signature image</p>
                    <p>Recommended: transparent PNG, 200x80px</p>
                    {signaturePreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setSignaturePreview('')}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <SaveButton onClick={saveSignature} saving={savingSignature} label="Save Signature" />
                </div>
              </CardContent>
            </Card>

            {/* Seal Generator */}
            <Card className="rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-600" />
                    Seal Generator
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="useSeal" className="text-sm font-normal">
                      Use Seal
                    </Label>
                    <Switch
                      id="useSeal"
                      checked={useSeal}
                      onCheckedChange={setUseSeal}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <SealGenerator
                  companyName={sealCompanyName}
                  detail={sealDetail}
                  onCompanyNameChange={setSealCompanyName}
                  onDetailChange={setSealDetail}
                  onSealGenerated={setSealPreview}
                />

                <Separator />

                <div className="flex justify-end">
                  <SaveButton onClick={saveSeal} saving={savingSeal} label="Save Seal Settings" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Terms & Conditions ───────────────────────────────── */}
        <TabsContent value="terms" className="mt-0">
          <Card className="rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Terms & Conditions
                </CardTitle>
                <Button
                  onClick={addTerm}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  Add Term
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {terms.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No terms added yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click &quot;Add Term&quot; to get started
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={terms.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {terms.map((term, index) => (
                        <SortableTermItem
                          key={term.id}
                          term={term}
                          index={index}
                          onUpdate={updateTerm}
                          onDelete={setDeleteTermId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Term Confirmation */}
      <Dialog open={!!deleteTermId} onOpenChange={() => setDeleteTermId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Term</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this term? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTermId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTerm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
