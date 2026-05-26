'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  FileText,
  Users,
  ArrowRight,
  Loader2,
  Clock,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'

interface SearchResult {
  id: string
  type: 'invoice' | 'customer'
  title: string
  subtitle: string
  badge?: string
  badgeColor?: string
  date?: string
}

export default function GlobalSearch() {
  const { user, setCurrentView, setPreviewInvoiceId, setEditInvoiceId } = useAppStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5))
      } catch { /* ignore */ }
    }
  }, [])

  // Keyboard shortcut: Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !user?.id) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        fetch(`/api/invoices?userId=${user.id}&search=${encodeURIComponent(q)}`),
        fetch(`/api/customers?userId=${user.id}&search=${encodeURIComponent(q)}`),
      ])

      const searchResults: SearchResult[] = []

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        for (const inv of (data.invoices || []).slice(0, 5)) {
          const statusColors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            sent: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
            paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
            overdue: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
          }
          searchResults.push({
            id: inv.id,
            type: 'invoice',
            title: inv.invoiceNumber,
            subtitle: inv.billToName || 'No customer',
            badge: inv.status,
            badgeColor: statusColors[inv.status] || statusColors.draft,
            date: inv.invoiceDate,
          })
        }
      }

      if (customersRes.ok) {
        const data = await customersRes.json()
        for (const cust of (data.customers || []).slice(0, 5)) {
          searchResults.push({
            id: cust.id,
            type: 'customer',
            title: cust.name,
            subtitle: cust.email || cust.phone || 'No contact info',
          })
        }
      }

      setResults(searchResults)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        search(query)
      } else {
        setResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, search])

  const handleSelect = (result: SearchResult) => {
    // Save to recent searches
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem('recent-searches', JSON.stringify(newRecent))

    setOpen(false)

    if (result.type === 'invoice') {
      setPreviewInvoiceId(result.id)
      setCurrentView('preview-invoice')
    } else if (result.type === 'customer') {
      setCurrentView('customers')
    }
  }

  const handleRecentSearch = (term: string) => {
    setQuery(term)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden rounded-xl border border-border/50 shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="size-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoices, customers..."
            className="border-0 shadow-none focus-visible:ring-0 px-3 text-base"
          />
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => { setQuery(''); setResults([]) }}
              className="shrink-0 p-1 hover:bg-accent rounded-md transition-colors"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground ml-2 shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.trim() === '' && recentSearches.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                Recent Searches
              </p>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleRecentSearch(term)}
                  className="flex items-center gap-3 w-full px-2 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Clock className="size-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{term}</span>
                </button>
              ))}
            </div>
          )}

          {query.trim() && results.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-muted-foreground mt-1">Try searching for an invoice number or customer name</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              <AnimatePresence>
                {results.map((result, index) => (
                  <motion.button
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelect(result)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-accent transition-colors text-left group"
                  >
                    <div className={`flex items-center justify-center size-8 rounded-lg shrink-0 ${
                      result.type === 'invoice'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50'
                        : 'bg-teal-50 dark:bg-teal-950/50'
                    }`}>
                      {result.type === 'invoice' ? (
                        <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Users className="size-4 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{result.title}</span>
                        {result.badge && (
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${result.badgeColor || ''}`}>
                            {result.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                    {result.date && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(result.date), 'dd MMM')}
                      </span>
                    )}
                    <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <Separator />
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">↵</kbd>
              Open
            </span>
          </div>
          <span className="text-muted-foreground/60">
            {results.length > 0 ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'Search across invoices & customers'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
