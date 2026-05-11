"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const DEMO_MAIL =
  "mailto:irontrackdevelopment@outlook.com?subject=IronTrack%20Field%20Pulse%20Demo&body=I%27d%20like%20to%20book%20a%20demo%20of%20IronTrack%20Field%20Pulse.";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border border-slate-200 bg-white py-3 shadow-xl">
          <a
            href="#features"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Product
          </a>
          <a
            href="#workflow"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Solutions
          </a>
          <a
            href="#who-we-serve"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Who we serve
          </a>
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Pricing
          </a>
          <Link
            href="/release-notes"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Resources
          </Link>
          <Link
            href="/status"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Status
          </Link>
          <hr className="my-2 border-slate-100" />
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Log in
          </Link>
          <a
            href={DEMO_MAIL}
            onClick={() => setOpen(false)}
            className="mx-3 mt-1 flex items-center justify-center rounded-lg py-2.5 text-sm font-bold text-white"
            style={{ background: "#F37021" }}
          >
            Get a demo
          </a>
        </div>
      )}
    </div>
  );
}
