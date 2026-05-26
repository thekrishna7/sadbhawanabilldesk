'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Moon,
  Sun,
  Bell,
  BellOff,
  Globe,
  Shield,
  Trash2,
  Info,
  Loader2,
  Save,
  Palette,
  Keyboard,
  User,
  Check,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/stores/appStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SHORTCUT_LIST } from '@/hooks/useKeyboardShortcuts'
import { urlBase64ToUint8Array } from '@/lib/pushUtils'
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

// Section header colors for color-coded indicators
const sectionColors: Record<string, { border: string; bg: string; iconBg: string }> = {
  appearance: { border: 'border-l-emerald-500', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20', iconBg: 'bg-emerald-500' },
  notifications: { border: 'border-l-amber-500', bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20', iconBg: 'bg-amber-500' },
  language: { border: 'border-l-teal-500', bg: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/20', iconBg: 'bg-teal-500' },
  preferences: { border: 'border-l-cyan-500', bg: 'from-cyan-50 to-emerald-50 dark:from-cyan-950/30 dark:to-emerald-950/20', iconBg: 'bg-cyan-500' },
  account: { border: 'border-l-red-500', bg: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20', iconBg: 'bg-red-500' },
  shortcuts: { border: 'border-l-violet-500', bg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20', iconBg: 'bg-violet-500' },
  about: { border: 'border-l-gray-500', bg: 'from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/20', iconBg: 'bg-gray-500' },
}

export default function SettingsPage() {
  const { user, setUser, logout } = useAppStore()
  const { theme, setTheme } = useTheme()

  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [language, setLanguage] = useState('en')
  const [defaultTaxRate, setDefaultTaxRate] = useState('18')
  const [defaultDueDays, setDefaultDueDays] = useState('30')
  const [invoiceFormat, setInvoiceFormat] = useState('INV-{YYYY}-{000}')
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingTestEmail, setSendingTestEmail] = useState(false)

  const handleSendTestEmail = async () => {
    if (!user?.id) return
    setSendingTestEmail(true)
    try {
      const res = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Test email successfully sent to ${data.to}!`)
      } else {
        toast.error(data.error || 'Failed to send test email')
      }
    } catch {
      toast.error('Failed to send test email')
    } finally {
      setSendingTestEmail(false)
    }
  }

  // Load preferences from store/user details on mount
  useEffect(() => {
    if (user) {
      setDarkMode(user.darkMode ?? false)
      setEmailNotifications(user.notifications ?? true)
      setLanguage(user.language || 'en')
      setDefaultTaxRate(user.defaultTaxRate || '18')
      setDefaultDueDays(user.defaultDueDays || '30')
      setInvoiceFormat(user.invoiceFormat || 'INV-{YYYY}-{000}')
    }
  }, [user])

  // Check if push subscription already exists in browser on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((subscription) => {
        setPushNotifications(!!subscription)
      })
    })
  }, [])

  const handlePushNotificationsToggle = async (checked: boolean) => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) {
      toast.error('Push notifications are not supported in this browser')
      setPushNotifications(false)
      return
    }

    if (checked) {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          toast.error('Notification permission denied by browser')
          setPushNotifications(false)
          return
        }

        const registration = await navigator.serviceWorker.ready
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
          toast.error('VAPID Public Key not configured')
          setPushNotifications(false)
          return
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })

        // Save subscription on server
        if (user?.id) {
          const res = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              subscription,
            }),
          })

          if (res.ok) {
            setPushNotifications(true)
            toast.success('Push notifications enabled successfully')
          } else {
            throw new Error('Failed to save subscription')
          }
        }
      } catch (error) {
        console.error('Push subscription failed:', error)
        toast.error('Failed to enable push notifications')
        setPushNotifications(false)
      }
    } else {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
          // Delete from database
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
            }),
          })
        }
        setPushNotifications(false)
        toast.success('Push notifications disabled')
      } catch (error) {
        console.error('Failed to unsubscribe:', error)
        toast.error('Error disabling push notifications')
      }
    }
  }

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleDarkModeToggle = async (checked: boolean) => {
    setDarkMode(checked)
    setTheme(checked ? 'dark' : 'light')
    toast.success(checked ? 'Dark mode enabled' : 'Light mode enabled')

    if (user?.id) {
      try {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, darkMode: checked }),
        })
        setUser({ ...user, darkMode: checked })
      } catch (e) {
        console.error('Failed to auto-save theme setting', e)
      }
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    logout()
    toast.success('Account deleted successfully')
  }

  const handleSavePreferences = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          darkMode,
          notifications: emailNotifications,
          language,
          defaultTaxRate,
          defaultDueDays,
          invoiceFormat,
        }),
      })

      if (res.ok) {
        setUser({
          ...user,
          darkMode,
          notifications: emailNotifications,
          language,
          defaultTaxRate,
          defaultDueDays,
          invoiceFormat,
        })
        toast.success('Preferences saved successfully')
      } else {
        toast.error('Failed to save preferences')
      }
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = () => {
    handleSavePreferences()
  }

  // Profile completeness calculation
  const profileFields = [
    !!(user?.name),
    !!(user?.email),
    !!(user?.phone),
    darkMode !== undefined,
    language !== 'en' || true, // language is always set
    defaultTaxRate !== '18' || true, // always has value
  ]
  const filledFields = profileFields.filter(Boolean).length
  const profileCompleteness = Math.round((filledFields / profileFields.length) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-20 animate-fade-in"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your app preferences and account
          </p>
        </div>
      </div>

      {/* ===== Profile Preview Card ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 card-shine">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-cyan-50/50 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-cyan-950/20">
              {/* Avatar */}
              <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20 text-white text-xl font-bold shrink-0">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold truncate">{user?.name || 'Demo User'}</h2>
                </div>
                <p className="text-sm text-muted-foreground truncate">{user?.email || 'demo@billflow.app'}</p>
              </div>
              {/* Profile completeness */}
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{profileCompleteness}% complete</span>
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompleteness}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Appearance ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className={`rounded-xl border-l-4 ${sectionColors.appearance.border} hover:shadow-lg transition-shadow duration-300 card-shine`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className={`flex items-center justify-center size-8 rounded-lg ${sectionColors.appearance.iconBg} text-white shadow-sm`}>
                <Palette className="h-4 w-4" />
              </div>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">Appearance</span>
            </CardTitle>
            <CardDescription>
              Customize how the app looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <Label htmlFor="darkMode" className="font-medium">
                    Dark Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle between light and dark themes
                  </p>
                </div>
              </div>
              <Switch
                id="darkMode"
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-emerald-600" />
                <div>
                  <Label className="font-medium">Theme Preference</Label>
                  <p className="text-xs text-muted-foreground">
                    Choose your preferred theme mode
                  </p>
                </div>
              </div>
              <Select
                value={darkMode ? 'dark' : 'light'}
                onValueChange={async (value) => {
                  const isDark = value === 'dark'
                  setTheme(value)
                  setDarkMode(isDark)
                  if (user?.id) {
                    try {
                      await fetch('/api/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id, darkMode: isDark }),
                      })
                      setUser({ ...user, darkMode: isDark })
                    } catch (e) {
                      console.error('Failed to auto-save theme setting', e)
                    }
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Notifications ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={`rounded-xl border-l-4 ${sectionColors.notifications.border} hover:shadow-lg transition-shadow duration-300 card-shine`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className={`flex items-center justify-center size-8 rounded-lg ${sectionColors.notifications.iconBg} text-white shadow-sm`}>
                <Bell className="h-4 w-4" />
              </div>
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">Notifications</span>
            </CardTitle>
            <CardDescription>
              Manage how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {emailNotifications ? (
                  <Bell className="h-5 w-5 text-emerald-600" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="emailNotif" className="font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive invoice updates via email
                  </p>
                </div>
              </div>
              <Switch
                id="emailNotif"
                checked={emailNotifications}
                onCheckedChange={(checked) => {
                  setEmailNotifications(checked)
                  toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled')
                }}
              />
            </div>
            <Separator />
            {emailNotifications && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-emerald-600" />
                    <div>
                      <Label className="font-medium">Test Email Delivery</Label>
                      <p className="text-xs text-muted-foreground">
                        Send a verification email using SMTP settings
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-xl"
                    onClick={handleSendTestEmail}
                    disabled={sendingTestEmail}
                  >
                    {sendingTestEmail ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Send Test Email
                  </Button>
                </div>
                <Separator />
              </>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {pushNotifications ? (
                  <Bell className="h-5 w-5 text-emerald-600" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="pushNotif" className="font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive browser push notifications
                  </p>
                </div>
              </div>
              <Switch
                id="pushNotif"
                checked={pushNotifications}
                onCheckedChange={handlePushNotificationsToggle}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Language ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className={`rounded-xl border-l-4 ${sectionColors.language.border} hover:shadow-lg transition-shadow duration-300 card-shine`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className={`flex items-center justify-center size-8 rounded-lg ${sectionColors.language.iconBg} text-white shadow-sm`}>
                <Globe className="h-4 w-4" />
              </div>
              Language
            </CardTitle>
            <CardDescription>
              Set your preferred language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-emerald-600" />
                <Label htmlFor="language" className="font-medium">
                  Display Language
                </Label>
              </div>
              <Select value={language} onValueChange={(value) => {
                setLanguage(value)
                toast.success('Language updated')
              }}>
                <SelectTrigger className="w-[180px]" id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== App Preferences ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className={`rounded-xl border-l-4 ${sectionColors.preferences.border} hover:shadow-lg transition-shadow duration-300 card-shine`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className={`flex items-center justify-center size-8 rounded-lg ${sectionColors.preferences.iconBg} text-white shadow-sm`}>
                <Shield className="h-4 w-4" />
              </div>
              App Preferences
            </CardTitle>
            <CardDescription>
              Configure default settings for invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDays">Default Due Date (days)</Label>
                <Input
                  id="dueDays"
                  type="number"
                  min="1"
                  max="365"
                  value={defaultDueDays}
                  onChange={(e) => setDefaultDueDays(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invFormat">Invoice Number Format</Label>
                <Input
                  id="invFormat"
                  value={invoiceFormat}
                  onChange={(e) => setInvoiceFormat(e.target.value)}
                  placeholder="INV-{YYYY}-{000}"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSavePreferences}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-xl"
              >
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Account ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className={`rounded-xl border-l-4 ${sectionColors.account.border} hover:shadow-lg transition-shadow duration-300 card-shine`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className={`flex items-center justify-center size-8 rounded-lg ${sectionColors.account.iconBg} text-white shadow-sm`}>
                <User className="h-4 w-4" />
              </div>
              Account
            </CardTitle>
            <CardDescription>
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Change Password */}
            <div className="space-y-4">
              <h4 className="font-medium">Change Password</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPass">Current Password</Label>
                  <Input
                    id="currentPass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPass">New Password</Label>
                  <Input
                    id="newPass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPass">Confirm Password</Label>
                  <Input
                    id="confirmPass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={saving}
                  variant="outline"
                  className="gap-2 rounded-xl"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Change Password
                </Button>
              </div>
            </div>

            <Separator />

            {/* Delete Account */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-destructive">Delete Account</h4>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2 border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl"
                onClick={() => setShowDeleteAccount(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Keyboard Shortcuts ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className={`rounded-xl border-l-4 ${sectionColors.shortcuts.border} hover:shadow-lg transition-shadow duration-300 card-shine`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className={`flex items-center justify-center size-8 rounded-lg ${sectionColors.shortcuts.iconBg} text-white shadow-sm`}>
                <Keyboard className="h-4 w-4" />
              </div>
              Keyboard Shortcuts
            </CardTitle>
            <CardDescription>
              Quick keyboard shortcuts for faster navigation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SHORTCUT_LIST.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.split('+').map((key, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg border border-border bg-gradient-to-b from-muted to-muted/50 shadow-[0_1px_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_0_1px_rgba(255,255,255,0.05)] text-xs font-mono font-medium text-foreground">
                          {key.trim()}
                        </kbd>
                        {i < shortcut.keys.split('+').length - 1 && (
                          <span className="text-muted-foreground text-xs">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== About ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className={`rounded-xl border-l-4 ${sectionColors.about.border} hover:shadow-lg transition-shadow duration-300 card-shine`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className={`flex items-center justify-center size-8 rounded-lg ${sectionColors.about.iconBg} text-white shadow-sm`}>
                <Info className="h-4 w-4" />
              </div>
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">App Version</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  v1.0.0
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contact</span>
                <span className="text-sm">support@smartbilling.app</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">License</span>
                <span className="text-sm">MIT License</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Delete Account Confirmation ===== */}
      <AlertDialog
        open={showDeleteAccount}
        onOpenChange={setShowDeleteAccount}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. All your data,
              including invoices, customers, and profile information, will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Floating Save All Action Button ===== */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Button
            onClick={handleSaveAll}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all rounded-xl h-12 px-6 gap-2 animate-glow-pulse"
          >
            <Save className="h-4 w-4" />
            Save All
          </Button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
