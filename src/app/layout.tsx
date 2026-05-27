import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sadbhawana BillDesk - Smart Billing Made Simple",
  description: "Create, manage, and track invoices effortlessly. Sadbhawana BillDesk gives you everything you need to get paid faster with professional billing tools.",
  keywords: ["billing", "invoice", "SaaS", "payments", "QR payments", "PDF export"],
  icons: {
    icon: "/favicon-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/favicon-logo.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var origin = window.location.origin;
            var isCap = origin.startsWith('capacitor://') || origin.includes('localhost:') || !window.location.host;
            if (isCap) {
              var originalFetch = window.fetch;
              window.fetch = function(input, init) {
                if (typeof input === 'string' && input.startsWith('/api/')) {
                  input = 'https://sadbhawanabilldesk.vercel.app' + input;
                }
                return originalFetch(input, init);
              };
            }
          })();
        ` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
