'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWA } from '@/hooks/usePWA'

const DISMISSED_KEY = 'billflow_pwa_dismissed'

export default function PWAInstallPrompt() {
  const { canInstall, promptInstall } = usePWA()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem(DISMISSED_KEY)
  })

  const handleDismiss = useCallback(() => {
    setVisible(false)
    setDismissed(true)
    localStorage.setItem(DISMISSED_KEY, Date.now().toString())
  }, [])

  // Show prompt when installable (with a small delay for better UX)
  useEffect(() => {
    if (canInstall && !dismissed) {
      const timer = setTimeout(() => {
        setVisible(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [canInstall, dismissed])

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [visible, handleDismiss])

  const handleInstall = async () => {
    const accepted = await promptInstall()
    if (accepted) {
      setVisible(false)
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:max-w-sm z-50"
        >
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900 shadow-2xl shadow-emerald-500/10">
            {/* Gradient top bar */}
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

            {/* Content */}
            <div className="p-4">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Dismiss install prompt"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-start gap-3 pr-6">
                {/* Icon */}
                <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 shrink-0">
                  <Smartphone className="size-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">
                    Install BillFlow
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Add BillFlow to your home screen for quick access and offline support.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 ml-13">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 text-xs h-8"
                >
                  <Download className="size-3.5 mr-1.5" />
                  Install App
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-8"
                >
                  Not now
                </Button>
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute -bottom-4 -right-4 size-16 rounded-full bg-emerald-500/5" />
            <div className="absolute -top-2 -left-2 size-8 rounded-full bg-teal-500/5" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
