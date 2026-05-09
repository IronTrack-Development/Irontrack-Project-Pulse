"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const linkStyle: React.CSSProperties = { color: "rgba(13,13,13,0.65)" };
const textColor: React.CSSProperties = { color: "rgba(13,13,13,0.65)" };

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="p-2 rounded-lg transition-colors hover:bg-black/5"
        style={textColor}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <div
          className="absolute top-full left-0 right-0 px-5 py-5 flex flex-col gap-4 z-50 shadow-lg"
          style={{
            background: "#F5F3EE",
            borderBottom: "1px solid rgba(13,13,13,0.08)",
          }}
        >
          <a href="#workflow" onClick={() => setOpen(false)} className="text-sm font-medium" style={linkStyle}>How it works</a>
          <a href="#features" onClick={() => setOpen(false)} className="text-sm font-medium" style={linkStyle}>Features</a>
          <a href="#who-we-serve" onClick={() => setOpen(false)} className="text-sm font-medium" style={linkStyle}>Who we serve</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="text-sm font-medium" style={linkStyle}>Pricing</a>
          <div className="h-px my-1" style={{ background: "rgba(13,13,13,0.08)" }} />
          <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-medium" style={linkStyle}>Sign in</Link>
          <Link href="/signup" onClick={() => setOpen(false)} className="text-sm font-bold" style={{ color: "#E85D1C" }}>GC signup &rarr;</Link>
          <Link href="/signup/sub" onClick={() => setOpen(false)} className="text-sm font-bold" style={{ color: "#3B82F6" }}>Sub signup &rarr;</Link>
          <div className="h-px my-1" style={{ background: "rgba(13,13,13,0.08)" }} />
          <Link href="/status" onClick={() => setOpen(false)} className="text-xs" style={textColor}>Status</Link>
          <Link href="/release-notes" onClick={() => setOpen(false)} className="text-xs" style={textColor}>Release notes</Link>
        </div>
      )}
    </div>
  );
}
