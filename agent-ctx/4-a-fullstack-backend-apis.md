# Task 4-a: Full-Stack Developer (Backend APIs)

## Task: Create Invoice Duplicate, Payment, Bulk Actions, and Activity Log APIs

## Work Log

### 1. Activity Logger Utility (`/src/lib/activityLogger.ts`)
- Created reusable `logActivity()` helper function
- Accepts: userId, action, entityType, entityId, description, metadata
- Creates ActivityLog records via Prisma, with JSON-serialized metadata
- Used by all new API endpoints for consistent activity tracking

### 2. Invoice Duplicate API (`/api/invoices/duplicate/route.ts`)
- POST endpoint to duplicate an existing invoice
- Auto-generates unique invoice number (INV-YYYY-NNN format)
- Copies: billTo info, items, customerId, totals, amountInWords, termsText
- Resets: status to "draft", receivedAmount to 0, previousBalance to 0
- Validates ownership (403 if userId doesn't match)
- Logs activity

### 3. Payment Recording API (`/api/invoices/payments/route.ts`)
- GET: List payments for an invoice (ordered by paidAt DESC)
- POST: Record a payment against an invoice
  - Validates amount > 0 and method (cash, bank_transfer, upi, cheque, other)
  - Uses Prisma $transaction for atomic operations
  - Auto-marks invoice as "paid" when currentBalance <= 0
  - Logs both payment_recorded and paid activities

### 4. Bulk Invoice Actions API (`/api/invoices/bulk/route.ts`)
- POST: Bulk actions (delete, markSent, markPaid)
- Validates ownership and filters eligible invoices
- delete: Soft-delete with 7-day expiry
- markSent/markPaid: Skip deleted invoices
- Logs activity per invoice with bulkAction metadata

### 5. Activity Log API (`/api/activity/route.ts`)
- GET: List recent activity logs with filtering
- Supports: userId (required), limit, entityType, action
- Parses metadata JSON for convenience
- Returns total count for pagination

### Infrastructure
- Added `serverExternalPackages: ['@prisma/client']` to next.config.ts
- Resolved Prisma client caching issue (needed server restart for new models)
- All lint checks pass, dev server running without errors

## Stage Summary
- All 4 new API endpoints created and functional
- Activity logger utility created for reuse across routes
- All endpoints tested via curl with comprehensive test scenarios
- Error handling verified for all edge cases
