"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Settings,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#121217] border-r border-[#1F1F25] h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1F1F25]">
        <div className="relative w-8 h-8">
          <Image
            src="/irontrack-logo.png"
            alt="IronTrack Project Pulse"
            fill
            className="object-contain"
            onError={() => {}}
          />
        </div>
        <div>
          <div className="font-bold text-white text-sm leading-none">IronTrack</div>
          <div className="text-[10px] text-[#F97316] font-semibold tracking-widest uppercase mt-0.5">Daily</div>
        </div>
      </div>

      {/* Status pill */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-[#0B0B0D] rounded-lg px-3 py-2 border border-[#1F1F25]">
          <Zap size={13} className="text-[#F97316]" />
          <span className="text-xs text-gray-400">Field Intelligence</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2 mb-2">Navigation</div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-sm font-medium ${
                active
                  ? "bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#1F1F25]">
        <div className="text-xs text-gray-600">v1.0.0 · Phase 1</div>
      </div>
    </aside>
  );
}
