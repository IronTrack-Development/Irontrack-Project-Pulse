import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/MobileNav";
import ManifestLoader from "@/components/ManifestLoader";
import ThemeProvider from "@/components/ThemeProvider";
import I18nProvider from "@/components/I18nProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0B0B0D", // Dark background to match new branding
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://irontrackpulse.com"),
  title: "IronTrack Field Pulse — Subcontractor Job Inbox and Proof Log",
  description: "Control GC chaos across Procore, Autodesk, Fieldwire, email, PDFs, screenshots, texts, calls, and spreadsheets without requiring the GC to adopt another tool.",
  // manifest removed from metadata — loaded conditionally by ManifestLoader
  openGraph: {
    title: "IronTrack Field Pulse — Subcontractor Job Inbox and Proof Log",
    description: "Job Inbox, Work Cards, Readiness Board, Proof Log, GC Response, and Owner Snapshot for subcontractor teams.",
    images: [
      {
        url: "/og-share-card.png",
        width: 1536,
        height: 1024,
        alt: "IronTrack Field Pulse",
      },
    ],
    type: "website",
    siteName: "IronTrack Field Pulse",
  },
  twitter: {
    card: "summary_large_image",
    title: "IronTrack Field Pulse — Subcontractor Job Inbox and Proof Log",
    description: "Control GC chaos across portals, email, PDFs, screenshots, texts, calls, and spreadsheets without a GC rollout.",
    images: [
      {
        url: "/og-share-card.png",
        width: 1536,
        height: 1024,
        alt: "IronTrack Field Pulse",
      },
    ],
  },
  // appleWebApp removed from root — applied conditionally via ManifestLoader
  // to prevent iOS from overriding sub view URLs on Add to Home Screen
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/irontrack-field-pulse-icon.svg?v=4" />
        <link rel="apple-touch-icon" href="/irontrack-field-pulse-icon.svg?v=4" />
      </head>
      <body className="bg-[var(--bg-primary)] text-gray-100 min-h-screen overflow-x-hidden">
        <ManifestLoader />
        <ThemeProvider>
          <I18nProvider>
            {children}
            <MobileNav />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
