import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AppView = 
  | 'landing'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'dashboard'
  | 'invoices'
  | 'create-invoice'
  | 'preview-invoice'
  | 'customers'
  | 'reports'
  | 'profile'
  | 'settings'
  | 'recycle-bin'
  | 'notifications'
  | 'recurring'

export interface UserDetails {
  id: string
  name: string
  email: string
  phone: string
  profilePhoto?: string
  darkMode?: boolean
  language?: string
  notifications?: boolean
  defaultTaxRate?: string
  defaultDueDays?: string
  invoiceFormat?: string
  companyLogo?: string
}

interface AppState {
  // Navigation
  currentView: AppView
  previousView: AppView | null
  setCurrentView: (view: AppView) => void
  goBack: () => void

  // Auth
  isAuthenticated: boolean
  user: UserDetails | null
  setUser: (user: UserDetails | null) => void
  login: (user: UserDetails) => void
  logout: () => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Current invoice for preview
  previewInvoiceId: string | null
  setPreviewInvoiceId: (id: string | null) => void

  // Edit invoice
  editInvoiceId: string | null
  setEditInvoiceId: (id: string | null) => void

  // Splash screen
  showSplash: boolean
  setShowSplash: (show: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'landing',
      previousView: null,
      setCurrentView: (view) => set({ previousView: get().currentView, currentView: view }),
      goBack: () => {
        const { previousView } = get()
        if (previousView) {
          set({ currentView: previousView, previousView: null })
        }
      },

      // Auth
      isAuthenticated: false,
      user: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: (user) => set({ user, isAuthenticated: true, currentView: 'dashboard' }),
      logout: () => set({ user: null, isAuthenticated: false, currentView: 'landing' }),

      // Sidebar
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Invoice preview
      previewInvoiceId: null,
      setPreviewInvoiceId: (id) => set({ previewInvoiceId: id }),

      // Edit invoice
      editInvoiceId: null,
      setEditInvoiceId: (id) => set({ editInvoiceId: id }),

      // Splash
      showSplash: true,
      setShowSplash: (show) => set({ showSplash: show }),
    }),
    {
      name: 'billflow-app-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return localStorage.getItem(name)
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, value)
          } catch (e) {
            console.warn('Storage quota exceeded, state not persisted:', e)
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
          } catch {}
        },
      })),
      partialize: (state) => {
        // Strip large base64 strings to prevent QuotaExceededError in LocalStorage
        const userWithoutPhotos = state.user
          ? {
              ...state.user,
              profilePhoto: undefined,
              companyLogo: undefined,
            }
          : null
        return {
          isAuthenticated: state.isAuthenticated,
          user: userWithoutPhotos,
          currentView: state.currentView,
        }
      },
    }
  )
)
