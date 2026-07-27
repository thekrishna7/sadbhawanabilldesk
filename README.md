<div align="center">

  <img src="public/logosb.png" alt="Sadbhawana BillDesk Logo" width="140" height="140" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);" />

  # 🧾 Sadbhawana BillDesk

  **Next-Generation Business Invoicing, CRM & Financial Management Platform**

  *Built with Next.js 15, TypeScript, Tailwind CSS, Prisma & Supabase*

  <p align="center">
    <a href="https://sadbhawanabilldesk.vercel.app"><b>Explore Live Demo »</b></a>
    ·
    <a href="https://github.com/thekrishna7/sadbhawanabilldesk/issues">Report Bug</a>
    ·
    <a href="https://github.com/thekrishna7/sadbhawanabilldesk/issues">Request Feature</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Prisma-6.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Capacitor-Android_Native-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor" />
    <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  </p>

  ---
</div>

## 🌟 Overview

**Sadbhawana BillDesk** is a enterprise-grade, modern billing, customer relationship management (CRM), and financial report generation software designed for publication houses, agencies, distributors, and modern businesses.

Featuring real-time invoice calculations, customizable GST & non-GST invoice formats, one-click PDF generation, digital seal generators, automated WhatsApp/Email receipt dispatching, and native Android APK support.

---

## ✨ Key Features

### 📄 **Invoice & Receipt Management**
- **Customizable Invoicing:** Create, edit, and duplicate professional GST and non-GST invoices.
- **Dynamic Tax & Discounts:** Auto-calculated subtotals, CGST/SGST/IGST rates, flat & percentage discounts.
- **Instant PDF Export:** Download high-resolution print-ready PDFs with responsive scaling.
- **Public Shareable Links:** Send shareable links for client view with built-in instant download buttons.

### 🏢 **Business Profile & Branding**
- **Multi-Brand Support:** Manage company address, phone, email, website, GSTIN, and PAN details.
- **Digital Seal & Signature Generator:** Built-in Canvas digital rubber stamp generator and signature uploader.
- **Bank & UPI Credentials:** Display bank account numbers, IFSC codes, and custom UPI QR codes directly on invoices.

### 👥 **Customer Management (CRM)**
- **Customer Directory:** Track customer profiles, contact info, billing addresses, and overall outstanding balances.
- **Transaction Logs:** View complete invoice and payment history per customer.

### 📊 **Analytics & Reporting**
- **Interactive Dashboards:** Revenue charts, monthly comparison graphs, and payment status metrics via Recharts.
- **Recycle Bin & Activity Audit:** Soft-delete system with 30-day auto-expiry recovery and comprehensive activity logging.

### 🔄 **Automation & Notifications**
- **WhatsApp & Email Integration:** Send invoice PDFs & payment reminder alerts via WhatsApp Cloud API & Nodemailer.
- **Recurring Billing:** Configure automated weekly, monthly, or quarterly invoice generation schedules.
- **Supabase Auto-Keepalive:** Automated 24/7 background workflow to prevent free-tier database auto-pausing.

### 📱 **Cross-Platform Native Support**
- **PWA & Desktop Responsive:** Fully optimized for Mobile, Tablet, Desktop, and Dark/Light UI modes.
- **Android APK Integration:** Built-in Capacitor v8 setup for native Android deployment.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **UI Library** | [React 19](https://react.dev/), [Shadcn UI](https://ui.shadcn.com/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Database & ORM** | [Supabase (PostgreSQL)](https://supabase.com/), [Prisma ORM](https://www.prisma.io/) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) (Persisted) |
| **Mobile Runtime** | [Capacitor 8](https://capacitorjs.com/) (Android) |
| **Icons & Charts** | [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 📂 Project Structure

```text
sadbhawanabilldesk/
├── .github/
│   └── workflows/
│       └── keep-alive.yml         # Automated 24/7 Supabase keep-alive cron
├── android/                        # Capacitor Native Android App source
├── prisma/
│   └── schema.prisma              # Database schema definition
├── public/                         # Static logos, fonts & assets
├── src/
│   ├── app/                        # Next.js App Router (Pages & API endpoints)
│   │   ├── api/                    # Serverless API routes (Profile, Invoices, Auth, etc.)
│   │   ├── page.tsx                # Main Router View switcher
│   │   └── layout.tsx              # Root HTML & metadata layout
│   ├── components/                 # React Components
│   │   ├── auth/                   # Login, Signup, Password reset pages
│   │   ├── dashboard/              # Home analytics, Reports & Recycle Bin
│   │   ├── invoice/                # Invoice Builder, List, Preview & Print layouts
│   │   ├── layout/                 # Navbar, Sidebar & Search modals
│   │   ├── profile/                # Business Profile, Seal Generator & Terms
│   │   └── ui/                     # Shadcn UI base components
│   ├── hooks/                      # Custom React hooks (Shortcuts, Media, etc.)
│   ├── lib/                        # Prisma db connection & Utility helpers
│   └── stores/                     # Zustand global app store
├── capacitor.config.ts             # Capacitor configuration
├── next.config.ts                  # Next.js configuration
└── package.json                    # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.0 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/thekrishna7/sadbhawanabilldesk.git
cd sadbhawanabilldesk
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add your Supabase / PostgreSQL database connection strings:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres"

# Optional SMTP Mailer
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 4. Push Database Schema
Generate Prisma client and sync schema with your database:
```bash
npx prisma generate
npx prisma db push
```

### 5. Run Local Development Server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to explore the app!

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server on port 3001 |
| `npm run build` | Generates Prisma client and builds production bundle |
| `npm run start` | Runs production server |
| `npm run db:push` | Pushes Prisma schema updates directly to database |
| `npm run db:generate` | Generates latest Prisma Client |
| `npm run build:mobile` | Builds web app and syncs with Capacitor Android project |

---

## 📱 Mobile App (Android APK Build)

To sync and build the Android APK via Capacitor:

```bash
# 1. Build web output and sync with Android
npm run build:mobile

# 2. Open Android Studio to build APK
npx cap open android
```

---

## 👤 Author & Maintainer

**Krishna Sharma**
- **Website:** [The Digital Fixer](https://thedigitalfixer.in)
- **Organization:** Sadbhawana Publication
- **GitHub:** [@thekrishna7](https://github.com/thekrishna7)

---

<div align="center">
  <sub>Built with ❤️ by <b>Krishna Sharma</b> for <b>Sadbhawana Publication</b></sub>
</div>
