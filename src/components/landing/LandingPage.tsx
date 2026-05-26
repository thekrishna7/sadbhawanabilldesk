'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/appStore'
import { Button } from '@/components/ui/button'
import {
  Cloud,
  FileText,
  FileDown,
  QrCode,
  Smartphone,
  Save,
  ShieldCheck,
  Menu,
  X,
  ArrowRight,
  Check,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Zap,
  Star,
  Quote,
  ArrowUp,
  Sparkles,
} from 'lucide-react'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
]

const features = [
  {
    icon: Cloud,
    title: 'Cloud Sync',
    description: 'Access your invoices from anywhere. Real-time sync across all your devices with secure cloud storage.',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    icon: FileText,
    title: 'Invoice Generator',
    description: 'Create professional invoices in seconds with customizable templates and auto-fill capabilities.',
    color: 'from-teal-400 to-cyan-500',
  },
  {
    icon: FileDown,
    title: 'PDF Export',
    description: 'Export invoices as high-quality PDFs with one click. Share directly via email or messaging apps.',
    color: 'from-cyan-400 to-emerald-500',
  },
  {
    icon: QrCode,
    title: 'QR Payments',
    description: 'Generate QR codes for instant payments. Accept payments seamlessly from any UPI app.',
    color: 'from-emerald-500 to-green-500',
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Fully responsive design that works perfectly on any device. Manage billing on the go.',
    color: 'from-green-400 to-emerald-500',
  },
  {
    icon: Save,
    title: 'Auto Save',
    description: 'Never lose your work again. Automatic saving ensures your data is always safe and recoverable.',
    color: 'from-teal-500 to-emerald-400',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Login',
    description: 'Enterprise-grade security with encrypted authentication. Your business data stays protected.',
    color: 'from-emerald-400 to-green-400',
  },
]

// pricingPlans removed

const testimonials = [
  {
    name: 'Rajesh K.',
    company: 'Sadbhawana Publication',
    quote: 'Sadbhawana BillDesk transformed our billing process',
    description: 'We used to spend hours creating invoices manually. Now it takes seconds. The professional templates have impressed our clients and we get paid faster.',
    rating: 5,
  },
  {
    name: 'Priya S.',
    company: 'TechStart India',
    quote: 'Professional invoices in seconds',
    description: 'As a startup founder, I need tools that just work. Sadbhawana BillDesk delivers exactly that — beautiful invoices, instant PDF generation, and seamless QR payments.',
    rating: 5,
  },
  {
    name: 'Amit M.',
    company: 'DesignHub',
    quote: 'The best billing tool for small businesses',
    description: 'I\'ve tried many invoicing tools, but Sadbhawana BillDesk stands out. The auto-save feature saved me from losing data multiple times, and the dashboard gives me complete visibility.',
    rating: 5,
  },
]

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function LandingPage() {
  const { setCurrentView } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [tiltStyle, setTiltStyle] = useState({ rotateX: 0, rotateY: 0 })
  const [counterValue, setCounterValue] = useState(0)
  const counterRef = useRef<HTMLDivElement>(null)
  const hasAnimatedCounter = useRef(false)

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Animated counter for "2,000+ businesses" using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedCounter.current) {
            hasAnimatedCounter.current = true
            const target = 2000
            const duration = 2000
            let startTime: number | null = null
            const animate = (timestamp: number) => {
              if (!startTime) startTime = timestamp
              const progress = Math.min((timestamp - startTime) / duration, 1)
              const eased = 1 - Math.pow(1 - progress, 3)
              setCounterValue(Math.floor(eased * target))
              if (progress < 1) {
                requestAnimationFrame(animate)
              } else {
                setCounterValue(target)
              }
            }
            requestAnimationFrame(animate)
          }
        })
      },
      { threshold: 0.5 }
    )
    if (counterRef.current) observer.observe(counterRef.current)
    return () => observer.disconnect()
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 3D tilt effect for invoice mockup
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -8
    const rotateY = ((x - centerX) / centerX) * 8
    setTiltStyle({ rotateX, rotateY })
  }

  const handleMouseLeave = () => {
    setTiltStyle({ rotateX: 0, rotateY: 0 })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shrink-0">
                <img
                  src="/logosb.png"
                  alt="Logo"
                  className="size-full object-contain bg-white p-0.5"
                />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Sadbhawana BillDesk
              </span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href.slice(1))}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('login')}
                className="text-sm"
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => setCurrentView('signup')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all"
              >
                Start Free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => scrollToSection(link.href.slice(1))}
                    className="block w-full text-left px-3 py-2.5 text-sm font-medium text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="pt-3 border-t border-border/50 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setCurrentView('login')
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setCurrentView('signup')
                    }}
                  >
                    Start Free
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent" />
        {/* Dot grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEuNSIgZmlsbD0icmdiYSgwLDg3LDIxNywwLjE1KSIvPjwvZz48L3N2Zz4=')] opacity-80 dark:opacity-40" />
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/5" />
        <div className="absolute bottom-10 right-1/4 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-400/5" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 mb-6"
              >
                <Zap className="h-3.5 w-3.5" />
                Smart Billing Platform
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Smart Billing{' '}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Create, manage, and track invoices effortlessly. Sadbhawana BillDesk gives
                you everything you need to get paid faster with professional
                billing tools.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start relative">
                {/* Subtle glow behind CTA buttons */}
                <div className="absolute -inset-4 bg-emerald-500/10 blur-2xl rounded-full dark:bg-emerald-500/5" />
                <Button
                  size="lg"
                  onClick={() => setCurrentView('signup')}
                  className="relative bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all text-base px-8 h-12"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('features')}
                  className="relative h-12 text-base px-8"
                >
                  See Features
                </Button>
              </div>

              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  No credit card
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  Free forever plan
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  Cancel anytime
                </div>
              </div>
            </motion.div>

            {/* Right - Invoice Mockup with 3D Tilt */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ perspective: '1000px' }}
            >
              <div
                className="relative mx-auto max-w-lg transition-transform duration-200 ease-out"
                style={{
                  transform: `rotateX(${tiltStyle.rotateX}deg) rotateY(${tiltStyle.rotateY}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Decorative glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-2xl" />

                {/* Invoice Card Mockup */}
                <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                  {/* Invoice Header */}
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-90">INVOICE</p>
                        <p className="text-2xl font-bold">#INV-2024-087</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Body */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">From</p>
                        <p className="font-semibold">Acme Corp</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-semibold">Mar 15, 2024</p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Web Design</span>
                        <span className="font-medium">₹2,500.00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Development</span>
                        <span className="font-medium">₹4,200.00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">SEO Optimization</span>
                        <span className="font-medium">₹800.00</span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          ₹7,500.00
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <QrCode className="h-3 w-3" />
                        Pay via QR
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                        <FileDown className="h-3 w-3" />
                        PDF Ready
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-3 -right-3 rounded-xl bg-card border border-border shadow-lg px-3 py-2 flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <Star className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Paid Instantly</p>
                    <p className="text-xs text-muted-foreground">via QR Code</p>
                  </div>
                </motion.div>

                {/* Floating cloud badge */}
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute -bottom-3 -left-3 rounded-xl bg-card border border-border shadow-lg px-3 py-2 flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                    <Cloud className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Cloud Synced</p>
                    <p className="text-xs text-muted-foreground">All devices</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By Section with Animated Counter & Infinite Scroll Logo Bar */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center" ref={counterRef}>
            <p className="text-sm font-medium text-muted-foreground mb-6">
              Trusted by <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent font-bold">{counterValue.toLocaleString()}+</span> businesses worldwide
            </p>
          </div>
          {/* Infinite scrolling logo bar */}
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />
            <div className="flex animate-infinite-scroll whitespace-nowrap">
              {[...['TechCorp', 'DesignHub', 'CloudBase', 'DataFlow', 'AppWorks', 'InnovateLabs', 'GreenTech', 'SynergyAI'], ...['TechCorp', 'DesignHub', 'CloudBase', 'DataFlow', 'AppWorks', 'InnovateLabs', 'GreenTech', 'SynergyAI']].map(
                (name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="text-lg font-bold tracking-wide text-muted-foreground/50 mx-8 shrink-0"
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-14"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 mb-4"
            >
              <Zap className="h-3.5 w-3.5" />
              Powerful Features
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
            >
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Bill Smarter
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              From creating invoices to getting paid, Sadbhawana BillDesk handles every
              aspect of your billing workflow with elegance and ease.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                className={`group relative rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-800 ${
                  i >= 4 ? 'xl:col-span-1' : ''
                } ${i === 6 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} shadow-sm mb-4`}
                >
                  <feature.icon className="h-5.5 w-5.5 text-white" />
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== Testimonials Section ===== */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-14"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 mb-4"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Customer Love
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
            >
              Loved by{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Businesses
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Don&apos;t just take our word for it. Here&apos;s what our customers have to say.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.name}
                variants={fadeInUp}
                className="relative rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-800"
              >
                {/* Quote icon */}
                <div className="absolute -top-3 left-6">
                  <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md">
                    <Quote className="size-4 text-white" />
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 mt-3 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote text */}
                <h3 className="font-semibold text-base mb-2">{testimonial.quote}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {testimonial.description}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section Removed */}

      {/* About / CTA Section - with animated gradient border */}
      <section id="about" className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden"
          >
            {/* Animated gradient border effect */}
            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-[length:200%_100%] animate-[gradient-shift_3s_ease-in-out_infinite]" />
            <div className="relative rounded-2xl overflow-hidden">
              {/* CTA Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50" />

              <div className="relative px-6 py-14 sm:px-12 sm:py-20 text-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Ready to Simplify Your Billing?
                </h2>
                <p className="mt-4 text-lg text-emerald-100 max-w-2xl mx-auto">
                  Join thousands of businesses who trust Sadbhawana BillDesk for their
                  invoicing needs. Start your free account today — no credit card
                  required.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    onClick={() => setCurrentView('signup')}
                    className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg h-12 text-base px-8"
                  >
                    Start Free Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 h-12 text-base px-8"
                    onClick={() => scrollToSection('features')}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FAQ Section ===== */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-t border-border/50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
            >
              Frequently Asked{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Questions
              </span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted-foreground">
              Everything you need to know about Sadbhawana BillDesk
            </motion.p>
          </motion.div>

          <div className="space-y-4">
            {[
              { q: 'Is Sadbhawana BillDesk really free?', a: 'Yes! Sadbhawana BillDesk is completely free to use with all features enabled.' },
              { q: 'Can I export invoices as PDF?', a: 'Absolutely. PDF export with your branding, company details, and professional formatting is included.' },
              { q: 'Is my data secure?', a: 'We use enterprise-grade encryption and secure cloud storage. Your business data is protected at all times.' },
              { q: 'Can I accept payments via QR code?', a: 'Yes! Upload your UPI QR code and customers can scan to pay directly from the invoice.' },
              { q: 'Do you offer customer support?', a: 'Yes! We offer customer support with a 24-hour response time.' },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <details className="group rounded-xl border border-border bg-card overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium">
                    {faq.q}
                    <span className="ml-2 shrink-0 text-emerald-500 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shrink-0">
                  <img
                    src="/logosb.png"
                    alt="Logo"
                    className="size-full object-contain bg-white p-0.5"
                  />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  Sadbhawana BillDesk
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Smart billing and invoicing platform designed to help businesses
                get paid faster.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <a
                  href="#"
                  className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-2.5">
                {['Features', 'Integrations', 'Changelog'].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-2.5">
                {['About Us', 'Careers', 'Blog', 'Contact'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms & Conditions', href: '#' },
                  { label: 'Cookie Policy', href: '#' },
                  { label: 'GDPR', href: '#' },
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Sadbhawana BillDesk. All rights reserved.
            </p>
            {/* Trust badges */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span>256-bit Encryption</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Made with{' '}
              <span className="text-emerald-500">&#9829;</span> for businesses
              worldwide
            </p>
          </div>
        </div>
      </footer>

      {/* ===== Scroll to Top Button ===== */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center size-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-shadow"
            aria-label="Scroll to top"
          >
            <ArrowUp className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== Custom CSS for animated gradient ===== */}
      <style jsx global>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}
