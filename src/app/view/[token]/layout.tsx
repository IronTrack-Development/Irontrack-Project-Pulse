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

    // Remove any existing manifest link (from root layout)
    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) existing.remove();

    // Add dynamic manifest pointing to this sub's token URL
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = `/api/view/${token}/manifest`;
    document.head.appendChild(link);

    // Set apple-mobile-web-app meta tags for iOS Add to Home Screen
    const setMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMeta("apple-mobile-web-app-capable", "yes");
    setMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    setMeta("apple-mobile-web-app-title", "IronTrack Pulse");

    return () => {
      // Cleanup on unmount
      const added = document.querySelector(`link[href="/api/view/${token}/manifest"]`);
      if (added) added.remove();
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-gray-100 overflow-x-hidden">
      {children}
    </div>
  );
}
