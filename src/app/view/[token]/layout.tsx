// Public layout for sub schedule views — no Sidebar, no MobileNav, no auth required.
// Uses a dynamic manifest so "Add to Home Screen" opens back to this sub's token URL.

"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function SubViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    if (!token) return;

    // Remove the root PWA manifest so iOS Safari saves the actual URL
    // instead of the manifest's start_url when user taps "Add to Home Screen"
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) manifestLink.remove();

    // Remove apple-mobile-web-app-capable so iOS doesn't treat this as a standalone app
    // This ensures "Add to Home Screen" saves the full /view/[token] URL
    const awaCap = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (awaCap) awaCap.remove();

    // Set the page title to something useful for the home screen icon name
    document.title = "IronTrack Pulse";

    return () => {};
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-gray-100 overflow-x-hidden">
      {children}
    </div>
  );
}
