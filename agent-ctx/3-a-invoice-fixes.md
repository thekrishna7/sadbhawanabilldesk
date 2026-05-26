# Task 3-a: InvoicePreview Fix & InvoiceList Status Workflow

## Summary
Fixed critical bugs in InvoicePreview component and added status change workflow to InvoiceList.

## Changes Made

### 1. InvoicePreview - Dedicated Detail Endpoint
**File**: `src/components/invoice/InvoicePreview.tsx`

- Changed data fetching from `GET /api/invoices?userId=...` (fetches ALL invoices) to `GET /api/invoices/detail?id=...&userId=...` (fetches single invoice)
- Restructured effect to use derived loading state (`invoice?.id !== previewInvoiceId`) instead of explicit `setLoading(true)` which caused lint errors (`react-hooks/set-state-in-effect`)
- Used `notFoundId` state pattern to track which specific invoice was not found, avoiding stale state issues when navigating between invoices
- Added cancellation token pattern to prevent stale responses from overwriting current data

### 2. InvoicePreview - Default Business Profile for Demo Users
**File**: `src/components/invoice/InvoicePreview.tsx`

- When no business profile exists, defaults now use:
  - Company name: Falls back to `user?.name || 'Your Company'`
  - Company logo: Shows `/logo.png` (Sadhbawana Publication logo) instead of empty/Building2 icon
  - Phone/Email: Falls back to user's phone/email
- Added `displayName` computed variable used consistently across company name and signatory sections

### 3. InvoiceList - Status Change Workflow
**File**: `src/components/invoice/InvoiceList.tsx`

- Added `handleStatusChange()` function that calls `POST /api/invoices/status` with `{ id, status }`
- Added `getStatusActions()` function that returns context-appropriate status transitions:
  - **Draft invoices**: "Mark as Sent" option
  - **Sent invoices**: "Mark as Paid" option + "Mark as Overdue" (if past due date)
  - **Overdue invoices**: "Mark as Paid" option
  - **Paid invoices**: No status change options
- Added `StatusWorkflow` visual indicator (3-dot progress: Draft → Sent → Paid) on grid cards
- Added `StatusDropdownItems` shared component for both grid and list dropdown menus
- Added `updatingStatus` state to show loading spinner on the menu button during status updates
- Toast notifications on success/error
- Local state update after successful status change (optimistic UI pattern)

## Lint Status
✅ All lint checks pass cleanly with zero errors.

## Technical Decisions
- Used derived loading state pattern to avoid `react-hooks/set-state-in-effect` lint rule
- Used `notFoundId` instead of boolean `notFound` to prevent stale not-found state when navigating between invoices
- Status workflow follows natural business flow: Draft → Sent → Paid (with Overdue as alternate from Sent)
