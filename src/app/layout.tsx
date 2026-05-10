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
  title: "IronTrack Pulse — Subcontractor Field Portal",
  description: "Run subcontractor crews from dispatch to handoff. IronTrack Pulse brings morning dispatch, field check-ins, production, blockers, SOPs, bilingual updates, and GC-ready visibility into one mobile portal.",
  // manifest removed from metadata — loaded conditionally by ManifestLoader
  openGraph: {
    title: "IronTrack Pulse — Subcontractor Field Portal",
    description: "Dispatch crews, capture check-ins, track production, raise blockers, manage SOPs, and hand off clean field context from one subcontractor portal.",
    images: [
      {
        url: "/og-share-card.png",
        width: 1536,
        height: 1024,
        alt: "IronTrack Pulse subcontractor field portal",
      },
    ],
    type: "website",
    siteName: "IronTrack Pulse",
  },
  twitter: {
    card: "summary_large_image",
    title: "IronTrack Pulse — Subcontractor Field Portal",
    description: "Morning dispatch, check-ins, production, blockers, SOPs, handoffs, and GC-ready visibility for subcontractor field teams.",
    images: [
      {
        url: "/og-share-card.png",
        width: 1536,
        height: 1024,
        alt: "IronTrack Pulse subcontractor field portal",
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
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png?v=3" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=3" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=3" />
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
