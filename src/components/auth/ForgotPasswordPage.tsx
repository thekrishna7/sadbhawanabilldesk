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
  ArrowLeft,
  Loader2,
  Mail,
  CheckCircle2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const { setCurrentView } = useAppStore()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1: Email, 2: OTP & New Password, 3: Success
  const [isLoading, setIsLoading] = useState(false)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; code?: string; password?: string; confirmPassword?: string }>({})

  const validateStep1 = (): boolean => {
    const newErrors: typeof errors = {}
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: typeof errors = {}
    
    if (!code.trim()) {
      newErrors.code = 'Verification code is required'
    } else if (code.trim().length !== 6) {
      newErrors.code = 'OTP must be a 6-digit number'
    }

    if (!newPassword) {
      newErrors.password = 'New password is required'
    } else if (newPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep1()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to send OTP code')
        return
      }

      toast.success('OTP Sent!', {
        description: 'Check your email inbox for the 6-digit verification code.',
      })
      setStep(2)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Password reset failed')
        return
      }

      toast.success('Password changed successfully!')
      setStep(3)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
        {step !== 3 && (
          <button
            onClick={() => {
              if (step === 2) {
                setStep(1)
              } else {
                setCurrentView('login')
              }
            }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 2 ? 'Change email address' : 'Back to login'}
          </button>
        )}

        <Card className="border-border/50 shadow-xl relative overflow-hidden bg-white/90 dark:bg-black/40 border border-white/30 dark:border-white/10">
          <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-br from-emerald-400/50 via-teal-400/30 to-emerald-400/50 pointer-events-none" />
          <div className="absolute inset-[1px] rounded-xl bg-card pointer-events-none" />
          
          <CardHeader className="text-center pb-2 relative z-10">
            {/* Logo */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shrink-0">
              <img
                src="/sbbdlogo.png"
                alt="Logo"
                className="size-full object-contain bg-white p-0.5"
              />
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === 1 && 'Forgot Password?'}
              {step === 2 && 'Verify Code & Reset'}
              {step === 3 && 'Password Changed!'}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Enter your email and we'll send you a 6-digit OTP code."}
              {step === 2 && `We've sent a 6-digit OTP code to ${email}`}
              {step === 3 && 'Your password has been successfully updated.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleRequestOTP}
                  className="space-y-4"
                >
                  <div className="flex justify-center mb-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors(prev => ({ ...prev, email: undefined }))
                      }}
                      className={errors.email ? 'border-destructive' : ''}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md h-10"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP Code'
                    )}
                  </Button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleResetPassword}
                  className="space-y-4"
                >
                  <div className="flex justify-center mb-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <KeyRound className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>

                  {/* Verification Code */}
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">6-Digit Verification Code (OTP)</Label>
                    <Input
                      id="verification-code"
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      className={`text-center font-mono tracking-widest text-lg ${errors.code ? 'border-destructive' : ''}`}
                      value={code}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setCode(val)
                        if (errors.code) setErrors(prev => ({ ...prev, code: undefined }))
                      }}
                    />
                    {errors.code && (
                      <p className="text-xs text-destructive">{errors.code}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value)
                          if (errors.password) setErrors(prev => ({ ...prev, password: undefined }))
                        }}
                        className={errors.password ? 'border-destructive' : ''}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-type your password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }))
                        }}
                        className={errors.confirmPassword ? 'border-destructive' : ''}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md h-10"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </motion.form>
              )}

              {step === 3 && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-4 space-y-4"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Your password has been changed successfully. You can now use your new password to sign in.
                    </p>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md h-10"
                    onClick={() => setCurrentView('login')}
                  >
                    Go to Login
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
