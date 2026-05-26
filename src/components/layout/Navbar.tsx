'use client'

import React, { useState, useEffect } from 'react'
import { useAppStore, type AppView } from '@/stores/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Menu,
  Search,
  Bell,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  BarChart3,
  Building2,
  Settings,
  Trash2,
  LogOut,
  Moon,
  Sun,
  User,
  FileTextIcon,
  DollarSign,
  AlertCircle,
  Info,
  ArrowRight,
  Check,
  CheckCheck,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

const viewTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  invoices: 'Invoices',
  'create-invoice': 'Create Invoice',
  'preview-invoice': 'Preview Invoice',
  customers: 'Customers',
  reports: 'Reports',
  profile: 'Business Profile',
  settings: 'Settings',
  'recycle-bin': 'Recycle Bin',
  notifications: 'Notifications',
}

interface NavItem {
  view: AppView
  label: string
  icon: React.ElementType
}

const mainNavItems: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'invoices', label: 'Invoices', icon: FileText },
  { view: 'create-invoice', label: 'Create Invoice', icon: PlusCircle },
  { view: 'customers', label: 'Customers', icon: Users },
  { view: 'reports', label: 'Reports', icon: BarChart3 },
  { view: 'profile', label: 'Business Profile', icon: Building2 },
  { view: 'settings', label: 'Settings', icon: Settings },
  { view: 'recycle-bin', label: 'Recycle Bin', icon: Trash2 },
]

// ===== Notification Types =====
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  createdAt: string
  read: boolean
  entityId?: string
  entityType?: string
}

export function getNotificationIcon(type: string) {
  switch (type) {
    case 'invoice_created': return FileTextIcon
    case 'invoice_sent':    return FileTextIcon
    case 'payment_received': return DollarSign
    case 'invoice_paid':    return DollarSign
    case 'overdue':         return AlertCircle
    case 'reminder':        return AlertCircle
    default:                return Info
  }
}

export function getNotificationColor(type: string) {
  switch (type) {
    case 'invoice_created': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
    case 'invoice_sent':    return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
    case 'payment_received': return 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400'
    case 'invoice_paid':    return 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400'
    case 'overdue':         return 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
    case 'reminder':        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
    default:                return 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400'
  }
}

// ===== Notification Dropdown Content =====
function NotificationDropdown({ onViewAll, userId }: { onViewAll: () => void; userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const fetchNotifications = async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    if (userId) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, id }),
      }).catch(() => {})
    }
  }

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    if (userId) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {})
    }
  }

  return (
    <div className="w-80 sm:w-96">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 min-w-[20px] justify-center">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              onClick={markAllAsRead}
            >
              <CheckCheck className="size-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>
      <Separator />
      <ScrollArea className="max-h-80">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="size-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Bell className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">We&apos;ll notify you when something arrives</p>
          </div>
        ) : (
          <div className="py-1">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              const colorClass = getNotificationColor(notification.type)
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className={`flex items-center justify-center size-8 rounded-lg shrink-0 ${colorClass}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!notification.read ? 'font-medium' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="size-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
      <Separator />
      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 justify-center"
          onClick={onViewAll}
        >
          View All Notifications
          <ArrowRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}


export default function Navbar() {
  const { currentView, setCurrentView, user, setUser, logout, sidebarOpen, setSidebarOpen } = useAppStore()
  const { theme, setTheme } = useTheme()
  const title = viewTitles[currentView] || 'Dashboard'

  // Fetch real unread notification count
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch { /* silent */ }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleViewAllNotifications = () => {
    setCurrentView('notifications')
  }

  return (
    <>
      {/* ===== Mobile Top Navbar ===== */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b bg-background/80 backdrop-blur-lg px-4 h-14 print:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="shrink-0"
        >
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>

        <h1 className="text-sm font-semibold truncate mx-2">{title}</h1>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          >
            <Search className="size-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0 rounded-xl shadow-xl" sideOffset={8}>
              <NotificationDropdown onViewAll={handleViewAllNotifications} userId={user?.id} />
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="size-7">
                  <AvatarImage src={user?.profilePhoto || ''} alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900 dark:text-emerald-300">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentView('profile')}>
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentView('settings')}>
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                const newTheme = theme === 'dark' ? 'light' : 'dark'
                const isDark = newTheme === 'dark'
                setTheme(newTheme)
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
              }}>
                {theme === 'dark' ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} variant="destructive">
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ===== Desktop Top Navbar ===== */}
      <header className="hidden lg:flex items-center justify-between border-b bg-background/80 backdrop-blur-lg px-6 h-16 sticky top-0 z-40 print:hidden">
        <h1 className="text-xl font-semibold">{title}</h1>

        <div className="flex items-center gap-3">
          {/* Search - clickable to open GlobalSearch */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            className="relative w-72 flex items-center gap-2 h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent hover:border-accent-foreground/20 transition-colors cursor-pointer"
          >
            <Search className="size-4 shrink-0" />
            <span>Search invoices, customers...</span>
            <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              const newTheme = theme === 'dark' ? 'light' : 'dark'
              const isDark = newTheme === 'dark'
              setTheme(newTheme)
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
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notification Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-[9px] font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0 rounded-xl shadow-xl" sideOffset={8}>
              <NotificationDropdown onViewAll={handleViewAllNotifications} userId={user?.id} />
            </PopoverContent>
          </Popover>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="size-9">
                  <AvatarImage src={user?.profilePhoto || ''} alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm dark:bg-emerald-900 dark:text-emerald-300">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentView('profile')}>
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentView('settings')}>
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} variant="destructive">
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ===== Mobile Sidebar Sheet ===== */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg overflow-hidden bg-emerald-600 text-white shrink-0">
                <img
                  src="/logosb.png"
                  alt="Company Logo"
                  className="size-full object-contain bg-white p-0.5"
                />
              </div>
              <span className="text-lg font-bold">Sadbhawana BillDesk</span>
            </SheetTitle>
            <SheetDescription className="sr-only">Navigation menu</SheetDescription>
          </SheetHeader>

          {user && (
            <div className="px-4 py-2">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Avatar className="size-9">
                  <AvatarImage src={user.profilePhoto || ''} alt={user.name} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm dark:bg-emerald-900 dark:text-emerald-300">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          <Separator className="my-1" />

          <ScrollArea className="flex-1 px-2">
            <nav className="flex flex-col gap-1 py-2">
              {mainNavItems.map((item) => {
                const isActive = currentView === item.view
                const Icon = item.icon
                return (
                  <button
                    key={item.view}
                    onClick={() => {
                      setCurrentView(item.view)
                      setSidebarOpen(false)
                    }}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full text-left ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon
                      className={`size-4 ${
                        isActive ? 'text-emerald-600 dark:text-emerald-400' : ''
                      }`}
                    />
                    {item.label}
                    {isActive && (
                      <div className="ml-auto size-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                )
              })}
            </nav>
          </ScrollArea>

          <div className="border-t p-3 mt-auto">
            <button
              onClick={() => {
                logout()
                setSidebarOpen(false)
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
