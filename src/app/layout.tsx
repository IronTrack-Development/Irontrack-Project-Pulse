import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/MobileNav";
import ManifestLoader from "@/components/ManifestLoader";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0B0B0D", // Dark background to match new branding
};

export const metadata: Metadata = {
  title: "IronTrack Project Pulse — Feel The Pulse Of Your Project",
  description: "Upload your schedule. Get critical path intelligence, inspection tracking, risk detection, and executive snapshots — instantly. Built for superintendents and PMs who need answers, not spreadsheets.",
  // manifest removed from metadata — loaded conditionally by ManifestLoader
  openGraph: {
    title: "IronTrack Project Pulse — Feel The Pulse Of Your Project",
    description: "Critical path intelligence. Inspection tracking. Risk detection. Executive snapshots. Upload your schedule and know what matters today.",
    images: [
      {
        url: "/og-share-card.png",
        width: 1536,
        height: 1024,
        alt: "IronTrack Project Pulse",
      },
    ],
    type: "website",
    siteName: "IronTrack Project Pulse",
  },
  twitter: {
    card: "summary_large_image",
    title: "IronTrack Project Pulse — Feel The Pulse Of Your Project",
    description: "Critical path intelligence. Inspection tracking. Risk detection. Executive snapshots. Built for construction field teams.",
    images: [
      {
        url: "/og-share-card.png",
        width: 1536,
        height: 1024,
        alt: "IronTrack Project Pulse",
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
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png?v=3" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=3" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=3" />
      </head>
      <body className="bg-[#0B0B0D] text-gray-100 min-h-screen overflow-x-hidden">
        <ManifestLoader />
        <ThemeProvider>
          {children}
          <MobileNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
