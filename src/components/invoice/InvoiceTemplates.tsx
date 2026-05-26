'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Palette,
  Check,
  Sparkles,
  Layout,
  PenTool,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type TemplateName = 'classic' | 'modern' | 'creative' | 'professional'

interface InvoiceTemplate {
  id: TemplateName
  name: string
  description: string
  icon: React.ReactNode
  tags: string[]
  previewColors: {
    header: string
    accent: string
    body: string
    border: string
    text: string
  }
}

const TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Standard corporate invoice with traditional layout, bordered tables, and professional styling.',
    icon: <FileText className="h-5 w-5" />,
    tags: ['Traditional', 'Corporate'],
    previewColors: {
      header: 'bg-emerald-600',
      accent: 'bg-emerald-100',
      body: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-900',
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean minimalist design with left accent bar, no table borders, and generous white space.',
    icon: <Layout className="h-5 w-5" />,
    tags: ['Minimalist', 'Clean'],
    previewColors: {
      header: 'bg-teal-500',
      accent: 'bg-teal-50',
      body: 'bg-white',
      border: 'border-transparent',
      text: 'text-gray-800',
    },
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Colorful header with gradient, rounded corners, and vibrant accent colors for a bold look.',
    icon: <Palette className="h-5 w-5" />,
    tags: ['Vibrant', 'Bold'],
    previewColors: {
      header: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400',
      accent: 'bg-amber-50',
      body: 'bg-white',
      border: 'border-emerald-200',
      text: 'text-gray-900',
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Two-column layout with sidebar for company info, structured sections, and refined typography.',
    icon: <PenTool className="h-5 w-5" />,
    tags: ['Premium', 'Structured'],
    previewColors: {
      header: 'bg-gray-800',
      accent: 'bg-emerald-50',
      body: 'bg-white',
      border: 'border-gray-300',
      text: 'text-gray-900',
    },
  },
]

const TEMPLATE_STORAGE_KEY = 'billflow_invoice_template'

export function getStoredTemplate(): TemplateName {
  if (typeof window === 'undefined') return 'classic'
  try {
    const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY)
    if (stored && TEMPLATES.some(t => t.id === stored)) {
      return stored as TemplateName
    }
  } catch {
    // ignore
  }
  return 'classic'
}

export function setStoredTemplate(template: TemplateName) {
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, template)
  } catch {
    // ignore
  }
}

// Mini preview component for each template
function TemplatePreview({ template, isSelected }: { template: InvoiceTemplate; isSelected: boolean }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 transition-all duration-200 bg-white">
      {/* Header */}
      <div className={cn('h-8 flex items-center px-2', template.previewColors.header)}>
        <div className="w-6 h-1.5 bg-white/40 rounded-full" />
        <div className="ml-auto flex gap-1">
          <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
          <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
        </div>
      </div>

      {template.id === 'modern' && (
        <div className="absolute left-0 top-8 bottom-0 w-1 bg-teal-400" />
      )}

      {template.id === 'professional' && (
        <div className="absolute left-0 top-8 bottom-0 w-12 bg-gray-100 border-r border-gray-200">
          <div className="mt-2 mx-1.5 w-8 h-8 rounded bg-gray-300" />
          <div className="mt-2 mx-1.5 w-8 h-1 bg-gray-300 rounded" />
          <div className="mt-1 mx-1.5 w-6 h-1 bg-gray-200 rounded" />
        </div>
      )}

      {/* Body content simulation */}
      <div className={cn(
        'p-2',
        template.id === 'professional' && 'ml-12',
        template.id === 'modern' && 'ml-2',
      )}>
        {/* Bill To section */}
        <div className={cn('rounded p-1.5 mb-2', template.previewColors.accent)}>
          <div className="w-6 h-1 bg-gray-400 rounded mb-1" />
          <div className="w-12 h-0.5 bg-gray-300 rounded" />
        </div>

        {/* Items table */}
        {template.id === 'modern' ? (
          <div className="space-y-1.5 mb-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between px-0.5">
                <div className="w-10 h-0.5 bg-gray-300 rounded" />
                <div className="w-4 h-0.5 bg-gray-200 rounded" />
                <div className="w-6 h-0.5 bg-gray-300 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className={cn('rounded overflow-hidden mb-2', template.id === 'creative' ? 'border border-emerald-200' : 'border border-gray-200')}>
            <div className={cn('h-3 flex items-center px-1', template.id === 'creative' ? 'bg-emerald-50' : 'bg-gray-100')}>
              <div className="w-6 h-0.5 bg-gray-400 rounded" />
              <div className="ml-auto w-3 h-0.5 bg-gray-300 rounded" />
            </div>
            {[1, 2].map(i => (
              <div key={i} className={cn('flex items-center justify-between px-1 py-0.5 h-2.5', i % 2 === 0 && 'bg-gray-50')}>
                <div className="w-8 h-0.5 bg-gray-300 rounded" />
                <div className="w-5 h-0.5 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className={cn('rounded px-1.5 py-1', template.previewColors.header)}>
          <div className="flex justify-between">
            <div className="w-6 h-1 bg-white/40 rounded" />
            <div className="w-8 h-1 bg-white/60 rounded" />
          </div>
        </div>
      </div>

      {/* Selected overlay */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-500 rounded-lg flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
            >
              <Check className="h-4 w-4 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface InvoiceTemplatesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTemplate: TemplateName
  onTemplateChange: (template: TemplateName) => void
}

export function InvoiceTemplates({
  open,
  onOpenChange,
  currentTemplate,
  onTemplateChange,
}: InvoiceTemplatesProps) {
  // selected is derived from currentTemplate (parent is source of truth)
  const selected = currentTemplate

  const handleSelect = (templateId: TemplateName) => {
    onTemplateChange(templateId)
    setStoredTemplate(templateId)
    toast.success(`Template changed to ${TEMPLATES.find(t => t.id === templateId)?.name}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Invoice Templates
          </DialogTitle>
          <DialogDescription>
            Choose a template style for your invoices. The selected template will be applied to all new invoices.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          {TEMPLATES.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all duration-200 overflow-hidden',
                  selected === template.id
                    ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'hover:shadow-md hover:scale-[1.02]'
                )}
                onClick={() => handleSelect(template.id)}
              >
                <CardContent className="p-3 space-y-2">
                  <TemplatePreview template={template} isSelected={selected === template.id} />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          'h-5 w-5 rounded flex items-center justify-center',
                          template.id === 'classic' && 'bg-emerald-100 text-emerald-600',
                          template.id === 'modern' && 'bg-teal-100 text-teal-600',
                          template.id === 'creative' && 'bg-amber-100 text-amber-600',
                          template.id === 'professional' && 'bg-gray-100 text-gray-600',
                        )}>
                          {template.icon}
                        </div>
                        <span className="font-semibold text-sm">{template.name}</span>
                      </div>
                      {selected === template.id && (
                        <Badge className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Template details for selected template */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 mt-2"
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                selected === 'classic' && 'bg-emerald-100 text-emerald-600',
                selected === 'modern' && 'bg-teal-100 text-teal-600',
                selected === 'creative' && 'bg-amber-100 text-amber-600',
                selected === 'professional' && 'bg-gray-100 text-gray-600',
              )}>
                {TEMPLATES.find(t => t.id === selected)?.icon}
              </div>
              <div>
                <h4 className="font-semibold text-sm">
                  {TEMPLATES.find(t => t.id === selected)?.name} Template
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {TEMPLATES.find(t => t.id === selected)?.description}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-end mt-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onOpenChange(false)}
          >
            <Check className="mr-2 h-4 w-4" />
            Apply Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
