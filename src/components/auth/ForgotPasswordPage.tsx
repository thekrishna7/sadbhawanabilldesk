'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FileText,
  ArrowLeft,
  Loader2,
  Mail,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const { setCurrentView } = useAppStore()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email')
      return false
    }
    setError(undefined)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitted(true)
    setIsLoading(false)

    toast.success('Reset link sent!', {
      description: 'Check your inbox for the password reset link.',
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50/50 via-background to-teal-50/30 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/10 p-4">
      {/* Background decorations */}
      <div className="absolute top-1/3 left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/5" />
      <div className="absolute bottom-1/4 right-1/3 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-400/5" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        {/* Back button */}
        <button
          onClick={() => setCurrentView('login')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-2">
            {/* Logo */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shrink-0">
              <img
                src="/sbbdlogo.png"
                alt="Logo"
                className="size-full object-contain bg-white p-0.5"
              />
            </div>
            <CardTitle className="text-2xl font-bold">
              Forgot Password?
            </CardTitle>
            <CardDescription>
              {isSubmitted
                ? 'Check your inbox for the reset link'
                : "Enter your email and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-4 space-y-4"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Reset link sent to:
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                      {email}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If an account exists with this email, you will receive a
                    password reset link shortly. Please check your spam folder
                    if you don&apos;t see it.
                  </p>
                  <div className="pt-2 space-y-2">
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                      onClick={() => setCurrentView('login')}
                    >
                      Back to Login
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => {
                        setIsSubmitted(false)
                        setEmail('')
                      }}
                    >
                      Didn&apos;t receive it? Try again
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {/* Email Icon */}
                  <div className="flex justify-center mb-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError(undefined)
                      }}
                      aria-invalid={!!error}
                      className={error ? 'border-destructive' : ''}
                      autoComplete="email"
                    />
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md h-10"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending link...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>

                  {/* Back to login */}
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => setCurrentView('login')}
                      className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
