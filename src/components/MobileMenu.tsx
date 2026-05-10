"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-[#0D0D0D] hover:text-[#E85D1C]"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="fixed left-0 right-0 top-[64px] z-50 flex flex-col gap-3 border-b border-[rgba(13,13,13,0.08)] bg-[#F5F3EE] px-5 py-5 shadow-xl">
          <a href="#workflow" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#0D0D0D]/70 hover:text-[#0D0D0D]">Workflow</a>
          <a href="#product" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#0D0D0D]/70 hover:text-[#0D0D0D]">Product</a>
          <a href="#teams" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#0D0D0D]/70 hover:text-[#0D0D0D]">Teams</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#0D0D0D]/70 hover:text-[#0D0D0D]">Pricing</a>
          <Link href="/status" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#0D0D0D]/70 hover:text-[#0D0D0D]">Status</Link>
          <Link href="/release-notes" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#0D0D0D]/70 hover:text-[#0D0D0D]">Release Notes</Link>
        </div>
      )}
    </div>
  );
}
