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
        className="p-2 text-[#111827] hover:text-[#F45A00]"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="fixed left-0 right-0 top-[86px] z-50 flex flex-col gap-3 border-b border-black/10 bg-[#F6F2EA] px-5 py-5 shadow-xl">
          <a href="#how-it-works" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#111827]/70 hover:text-[#111827]">How It Works</a>
          <a href="#workflow" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#111827]/70 hover:text-[#111827]">Workflow</a>
          <a href="#for-subs" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#111827]/70 hover:text-[#111827]">For Subs</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#111827]/70 hover:text-[#111827]">Pricing</a>
          <Link href="/status" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#111827]/70 hover:text-[#111827]">Status</Link>
          <Link href="/release-notes" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#111827]/70 hover:text-[#111827]">Release Notes</Link>
        </div>
      )}
    </div>
  );
}
