import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/MobileNav";
import ManifestLoader from "@/components/ManifestLoader";
import ThemeProvider from "@/components/ThemeProvider";
import I18nProvider from "@/components/I18nProvider";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#141414",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://irontrackpulse.com"),
  title: "IronTrack Field Pulse — Feel The Pulse Of Your Project",
  description: "Upload your schedule. Get critical path intelligence, inspection tracking, risk detection, and executive snapshots — instantly. Built for superintendents and PMs who need answers, not spreadsheets.",
  // manifest removed from metadata — loaded conditionally by ManifestLoader
  openGraph: {
    title: "IronTrack Field Pulse — Feel The Pulse Of Your Project",
    description: "Critical path intelligence. Inspection tracking. Risk detection. Executive snapshots. Upload your schedule and know what matters today.",
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
    title: "IronTrack Field Pulse — Feel The Pulse Of Your Project",
    description: "Critical path intelligence. Inspection tracking. Risk detection. Executive snapshots. Built for construction field teams.",
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
    <html lang="en" className={fontSans.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png?v=3" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=3" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=3" />
      </head>
      <body className="bg-[var(--bg-primary)] text-[color:var(--text-primary)] min-h-screen overflow-x-hidden antialiased">
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
