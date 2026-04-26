"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, Upload, Home, ClipboardList } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/", label: "Home", icon: Home },
];

export default function MobileNav() {
  const pathname = usePathname();

  // Don't show on public pages or sub view pages
  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/subscribe" || pathname.startsWith("/view/")) {
    return null;
  }

  // Detect if we're on a project page to show the Report shortcut
  const projectMatch = pathname.match(/^\/projects\/([a-f0-9-]+)/);
  const projectId = projectMatch ? projectMatch[1] : null;
  const isOnReportFlow = pathname.includes("/report");

  const items = [
    ...navItems,
    ...(projectId && !isOnReportFlow
      ? [{ href: `/projects/${projectId}/report`, label: "Report", icon: ClipboardList }]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (label !== "Dashboard" && label !== "Report" && href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                active ? "text-[#F97316]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
