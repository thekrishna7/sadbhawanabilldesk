'use client'

import React from 'react'
import { useAppStore, type AppView } from '@/stores/appStore'
import Navbar from './Navbar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  BarChart3,
  Building2,
  Settings,
  Trash2,
  LogOut,
  Sparkles,
  Bell,
  RefreshCw,
} from 'lucide-react'
import { motion } from 'framer-motion'
import PWAInstallPrompt from './PWAInstallPrompt'

interface NavItem {
  view: AppView
  label: string
  icon: React.ElementType
}

const sidebarNavItems: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'invoices', label: 'Invoices', icon: FileText },
  { view: 'create-invoice', label: 'Create Invoice', icon: PlusCircle },
  { view: 'customers', label: 'Customers', icon: Users },
  { view: 'reports', label: 'Reports', icon: BarChart3 },
  { view: 'recurring', label: 'Recurring', icon: RefreshCw },
  { view: 'profile', label: 'Business Profile', icon: Building2 },
  { view: 'settings', label: 'Settings', icon: Settings },
  { view: 'recycle-bin', label: 'Recycle Bin', icon: Trash2 },
  { view: 'notifications', label: 'Notifications', icon: Bell },
]

interface MobileTabItem {
  view: AppView
  label: string
  icon: React.ElementType
}

const mobileBottomTabs: MobileTabItem[] = [
  { view: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { view: 'invoices', label: 'Invoices', icon: FileText },
  { view: 'create-invoice', label: 'Create', icon: PlusCircle },
  { view: 'reports', label: 'Reports', icon: BarChart3 },
  { view: 'profile', label: 'Profile', icon: Building2 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentView, setCurrentView, user, logout } = useAppStore()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-sidebar z-30 print:hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b shrink-0">
          <div className="flex items-center justify-center size-9 rounded-xl overflow-hidden bg-emerald-600 text-white shadow-sm shrink-0">
            <img
              src="/logosb.png"
              alt="Company Logo"
              className="size-full object-contain bg-white p-0.5"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">Sadbhawana BillDesk</h2>
            <p className="text-[10px] text-muted-foreground leading-tight">Smart Billing Platform</p>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
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

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="flex flex-col gap-1">
            {sidebarNavItems.map((item) => {
              const isActive = currentView === item.view
              const Icon = item.icon
              return (
                <motion.button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all w-full text-left group ${isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950/60 dark:text-emerald-300 border-l-4 border-l-emerald-500 pl-2'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground border-l-4 border-l-transparent'
                    }`}
                >
                  <Icon
                    className={`size-4 transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'group-hover:text-foreground'
                      }`}
                  />
                  {item.label}
                  {isActive && (
                    <div className="ml-auto size-1.5 rounded-full bg-emerald-500" />
                  )}
                </motion.button>
              )
            })}
          </nav>
        </ScrollArea>


        {/* Logout */}
        <div className="border-t p-3 shrink-0">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={logout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
          >
            <LogOut className="size-4" />
            Log out
          </motion.button>
        </div>
      </aside>

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Navbar */}
        <Navbar />

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur-lg safe-area-bottom print:hidden">
          <div className="flex items-center justify-around h-16 px-2">
            {mobileBottomTabs.map((tab) => {
              const isActive = currentView === tab.view
              const Icon = tab.icon
              const isCreate = tab.view === 'create-invoice'
              return (
                <button
                  key={tab.view}
                  onClick={() => setCurrentView(tab.view)}
                  className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1 transition-colors ${isCreate
                    ? ''
                    : isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                    }`}
                >
                  {isCreate ? (
                    <div className="flex items-center justify-center size-10 -mt-3 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                      <Icon className="size-5" />
                    </div>
                  ) : (
                    <Icon className="size-5" />
                  )}
                  <span className={`text-[10px] leading-tight ${isCreate ? 'text-emerald-600 dark:text-emerald-400 font-medium' : isActive ? 'font-medium' : ''}`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
