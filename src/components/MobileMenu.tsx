"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white p-2">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 bg-[#0B0B0D] border-b border-[#1F1F25] px-4 py-4 flex flex-col gap-4 z-50">
          <a href="#about" onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-white">About Us</a>
          <a href="#who-we-serve" onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-white">Who We Serve</a>
          <a href="#features" onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-white">Features</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-white">Pricing</a>
          <Link href="/status" onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-white">Status</Link>
          <Link href="/release-notes" onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-white">Release Notes</Link>
        </div>
      )}
    </div>
  );
}
