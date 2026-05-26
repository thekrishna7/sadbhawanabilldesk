---
Task ID: 4-c
Agent: Full-Stack Developer (Dashboard + Styling)
Task: Add Dashboard Activity Timeline + Styling Improvements

Work Log:
- Created ActivityTimeline component (`/src/components/dashboard/ActivityTimeline.tsx`) with vertical timeline, color-coded icons, relative timestamps, mock data fallback
- Enhanced DashboardHome.tsx with gradient greeting banner, hover lift on stat cards, progress bar on Collection Rate, pulse animation on overdue indicator, two-column layout for Recent Invoices + Activity Timeline
- Enhanced InvoiceList.tsx with Duplicate option, Record Payment dialog, bulk selection mode with floating action bar, improved empty state
- Polished ProfilePage.tsx with gradient header banner with initials avatar, save confirmation animation (checkmark with spring rotation), better tab separation
- Added global CSS improvements: emerald-tinted scrollbar, focus-visible ring styles, card-hover-scale utility

Stage Summary:
- Activity Timeline fully functional on Dashboard with vertical timeline layout
- InvoiceList has Duplicate, Record Payment, and Bulk Actions features working
- Profile page has polished gradient header banner with save animations
- Overall UI is more polished with consistent rounded-xl, scrollbar, and focus ring styling
- All lint checks pass, dev server running without errors
