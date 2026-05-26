'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts() {
  const { isAuthenticated, setCurrentView, setEditInvoiceId, goBack } = useAppStore()

  useEffect(() => {
    if (!isAuthenticated) return

    const shortcuts: ShortcutConfig[] = [
      {
        key: 'd',
        alt: true,
        action: () => setCurrentView('dashboard'),
        description: 'Go to Dashboard',
      },
      {
        key: 'i',
        alt: true,
        action: () => setCurrentView('invoices'),
        description: 'Go to Invoices',
      },
      {
        key: 'n',
        alt: true,
        action: () => {
          setEditInvoiceId(null)
          setCurrentView('create-invoice')
        },
        description: 'New Invoice',
      },
      {
        key: 'c',
        alt: true,
        action: () => setCurrentView('customers'),
        description: 'Go to Customers',
      },
      {
        key: 'r',
        alt: true,
        action: () => setCurrentView('reports'),
        description: 'Go to Reports',
      },
      {
        key: 'p',
        alt: true,
        action: () => setCurrentView('profile'),
        description: 'Go to Profile',
      },
      {
        key: 's',
        alt: true,
        action: () => setCurrentView('settings'),
        description: 'Go to Settings',
      },
      {
        key: 'Escape',
        action: () => goBack(),
        description: 'Go Back',
      },
    ]

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Allow Escape even in inputs
        if (e.key === 'Escape') {
          ;(target as HTMLInputElement).blur()
        }
        return
      }

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey
        const shiftMatch = shortcut.shift ? e.shiftKey : true
        const altMatch = shortcut.alt ? e.altKey : !e.altKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAuthenticated, setCurrentView, setEditInvoiceId, goBack])
}

export const SHORTCUT_LIST: { keys: string; description: string }[] = [
  { keys: 'Ctrl + K', description: 'Open Search' },
  { keys: 'Alt + D', description: 'Go to Dashboard' },
  { keys: 'Alt + I', description: 'Go to Invoices' },
  { keys: 'Alt + N', description: 'New Invoice' },
  { keys: 'Alt + C', description: 'Go to Customers' },
  { keys: 'Alt + R', description: 'Go to Reports' },
  { keys: 'Alt + P', description: 'Go to Profile' },
  { keys: 'Alt + S', description: 'Go to Settings' },
  { keys: 'Esc', description: 'Go Back / Close' },
]
