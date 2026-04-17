// Public layout for sub schedule views — no Sidebar, no MobileNav, no auth required.
// This wraps /view/[token] with a clean, minimal shell.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule View — IronTrack Pulse",
  description: "Your project schedule — IronTrack Project Pulse",
};

export default function SubViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0B0D] text-gray-100">
      {children}
    </div>
  );
}
