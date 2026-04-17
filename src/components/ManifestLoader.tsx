"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Conditionally loads the PWA manifest and apple-web-app meta tags.
 * On /view/ pages (sub foreman links), these are NOT loaded so that
 * iOS "Add to Home Screen" saves the actual token URL instead of "/".
 */
export default function ManifestLoader() {
  const pathname = usePathname();
  const isSubView = pathname.startsWith("/view/");

  useEffect(() => {
    // Clean up any existing manifest link first
    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) existing.remove();

    // Clean up apple-web-app meta
    const existingAwac = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (existingAwac) existingAwac.remove();

    if (!isSubView) {
      // GC pages: add manifest + apple-web-app for full PWA experience
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "/manifest.json";
      document.head.appendChild(link);

      const meta = document.createElement("meta");
      meta.name = "apple-mobile-web-app-capable";
      meta.content = "yes";
      document.head.appendChild(meta);

      const metaStyle = document.createElement("meta");
      metaStyle.name = "apple-mobile-web-app-status-bar-style";
      metaStyle.content = "black-translucent";
      document.head.appendChild(metaStyle);

      const metaTitle = document.createElement("meta");
      metaTitle.name = "apple-mobile-web-app-title";
      metaTitle.content = "IronTrack Pulse";
      document.head.appendChild(metaTitle);
    }
    // On /view/ pages: no manifest, no apple-web-app-capable
    // iOS will save the raw URL as a regular bookmark
  }, [isSubView]);

  return null;
}
