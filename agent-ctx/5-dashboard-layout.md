# Task 5: Dashboard Layout & Dashboard Homepage - Agent Context

## Summary
Built the complete dashboard layout shell and homepage for the Smart Billing & Invoice SaaS Platform.

## Files Created/Modified
1. `/src/components/layout/Navbar.tsx` - Top navbar with desktop search, mobile hamburger, profile dropdown
2. `/src/components/layout/DashboardLayout.tsx` - Main layout with sidebar (desktop) + bottom nav (mobile)
3. `/src/components/dashboard/DashboardHome.tsx` - Dashboard homepage with stats, charts, recent invoices
4. `/src/app/page.tsx` - Updated app shell with splash screen, landing page, and dashboard router

## Key Architecture Decisions
- All navigation is client-side via Zustand store (currentView, sidebarOpen)
- ThemeProvider is in root layout.tsx (not duplicated in page.tsx)
- Dashboard API endpoint `/api/dashboard?userId={userId}` already exists and works
- Mock data fallback ensures dashboard renders even with empty database
- Create Invoice bottom tab has distinctive floating emerald circle design

## Store Integration
- `currentView` determines which view renders in DashboardRouter
- `sidebarOpen` controls the mobile Sheet sidebar
- `login()` from appStore is used for demo login on landing page
- `showSplash` / `setShowSplash` for initial splash screen

## Color Scheme
- Primary: Emerald (emerald-50/100/200/300/400/500/600/700/900/950)
- Secondary: Teal (teal-50/100/400/600/950)
- Warning: Amber (amber-50/100/400/500/600/950)
- Error: Red (red-50/100/400/600/700/900/950)
- Status badges: gray (draft), sky (sent), emerald (paid), red (overdue)

## Component Hierarchy
```
page.tsx
├── Splash Screen (showSplash)
├── LandingPage (!isAuthenticated)
└── DashboardRouter (isAuthenticated)
    └── DashboardLayout
        ├── Desktop Sidebar (lg:flex)
        ├── Navbar
        │   ├── Desktop Navbar (lg:flex)
        │   ├── Mobile Navbar (lg:hidden)
        │   └── Mobile Sheet Sidebar
        ├── Content Area (children)
        └── Mobile Bottom Nav (lg:hidden)
```
