'use client'

import React, { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout'
import GlobalSearch from '@/components/layout/GlobalSearch'

// All views loaded dynamically (client-only) to avoid Turbopack SSR bundle issues
const DashboardHome = dynamic(() => import('@/components/dashboard/DashboardHome'), { ssr: false })
const ReportsPage = dynamic(() => import('@/components/dashboard/ReportsPage'), { ssr: false })
const RecycleBinPage = dynamic(() => import('@/components/dashboard/RecycleBinPage'), { ssr: false })
const NotificationCenter = dynamic(() => import('@/components/dashboard/NotificationCenter'), { ssr: false })

const InvoiceForm = dynamic(() => import('@/components/invoice/InvoiceForm'), { ssr: false })
const InvoicePreview = dynamic(() => import('@/components/invoice/InvoicePreview'), { ssr: false })
const InvoiceList = dynamic(() => import('@/components/invoice/InvoiceList'), { ssr: false })
const CustomersPage = dynamic(() => import('@/components/invoice/CustomersPage'), { ssr: false })
const RecurringInvoicesPage = dynamic(() => import('@/components/invoice/RecurringInvoicesPage'), { ssr: false })

const ProfilePage = dynamic(() => import('@/components/profile/ProfilePage'), { ssr: false })
const SettingsPage = dynamic(() => import('@/components/settings/SettingsPage'), { ssr: false })
const PublicInvoicePreview = dynamic(() => import('@/components/invoice/PublicInvoicePreview'), { ssr: false })

// Landing & Auth
const LandingPage = dynamic(() => import('@/components/landing/LandingPage'), { ssr: false })
const LoginPage = dynamic(() => import('@/components/auth/LoginPage'), { ssr: false })
const SignupPage = dynamic(() => import('@/components/auth/SignupPage'), { ssr: false })
const ForgotPasswordPage = dynamic(() => import('@/components/auth/ForgotPasswordPage'), { ssr: false })

function DashboardRouter() {
  const { currentView } = useAppStore()

  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardHome />
      case 'invoices':
        return <InvoiceList />
      case 'create-invoice':
        return <InvoiceForm />
      case 'preview-invoice':
        return <InvoicePreview />
      case 'customers':
        return <CustomersPage />
      case 'recurring':
        return <RecurringInvoicesPage />
      case 'reports':
        return <ReportsPage />
      case 'profile':
        return <ProfilePage />
      case 'settings':
        return <SettingsPage />
      case 'recycle-bin':
        return <RecycleBinPage />
      case 'notifications':
        return <NotificationCenter />
      default:
        return <DashboardHome />
    }
  }

  return (
    <DashboardLayout>
      <GlobalSearch />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  )
}

function SplashScreen() {
  const { setShowSplash } = useAppStore()

  // Set this to true if you want to use a video logo animation instead of static image
  const USE_VIDEO_LOGO = true

  useEffect(() => {
    // If not using video logo, run default 2.5s timer
    if (!USE_VIDEO_LOGO) {
      const timer = setTimeout(() => setShowSplash(false), 2800)
      return () => clearTimeout(timer)
    } else {
      // Safety fallback timer of 8 seconds in case video doesn't play or load
      const timer = setTimeout(() => setShowSplash(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [setShowSplash, USE_VIDEO_LOGO])

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 text-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowSplash(false)}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center justify-center"
      >
        <div className="size-56 rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-md flex items-center justify-center shadow-2xl overflow-hidden border border-border/50">
          {USE_VIDEO_LOGO ? (
            <video
              src="/logo-animation.mp4"
              autoPlay
              muted
              playsInline
              onEnded={() => setShowSplash(false)}
              className="size-full object-cover"
            />
          ) : (
            <img src="/logosb.png" alt="Sadbhawana BillDesk" className="size-full object-contain p-4" />
          )}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="mt-12"
      >
        <div className="flex gap-1.5">
          <motion.div
            className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-400"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-400"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          <motion.div
            className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-400"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

function AuthRouter() {
  const { currentView } = useAppStore()

  switch (currentView) {
    case 'login':
      return <LoginPage />
    case 'signup':
      return <SignupPage />
    case 'forgot-password':
      return <ForgotPasswordPage />
    default:
      return <LandingPage />
  }
}

export default function Home() {
  const { isAuthenticated, showSplash, user, setUser } = useAppStore()
  const [publicInvoiceId, setPublicInvoiceId] = React.useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const pubId = params.get('publicInvoiceId')
      if (pubId) {
        setPublicInvoiceId(pubId)
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetch(`/api/profile?userId=${user.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.user) {
            const updatedUser = {
              ...user,
              name: data.user.name || user.name,
              email: data.user.email || user.email,
              phone: data.user.phone || user.phone,
              profilePhoto: data.user.profilePhoto || undefined,
              companyLogo: data.businessProfile?.companyLogo || undefined,
            }
            if (
              user.name !== updatedUser.name ||
              user.email !== updatedUser.email ||
              user.phone !== updatedUser.phone ||
              user.profilePhoto !== updatedUser.profilePhoto ||
              user.companyLogo !== updatedUser.companyLogo
            ) {
              setUser(updatedUser)
            }
          }
        })
        .catch(() => {})
    }
  }, [isAuthenticated, user?.id, setUser])

  if (publicInvoiceId) {
    return <PublicInvoicePreview invoiceId={publicInvoiceId} onClose={() => setPublicInvoiceId(null)} />
  }

  if (showSplash) {
    return <SplashScreen />
  }

  if (!isAuthenticated) {
    return <AuthRouter />
  }

  return <DashboardRouter />
}
