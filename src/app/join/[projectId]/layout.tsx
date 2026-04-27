"use client";

import { useEffect } from "react";

// Minimal layout for the sub self-registration flow.
// No sidebar, no mobile nav, no app manifest (same pattern as /view/ pages).
export default function JoinLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Remove the root PWA manifest so iOS saves the actual URL on "Add to Home Screen"
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) manifestLink.remove();

    const awaCap = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (awaCap) awaCap.remove();

    document.title = "IronTrack Pulse — Join Project";
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-gray-100 overflow-x-hidden">
      {children}
    </div>
  );
}
