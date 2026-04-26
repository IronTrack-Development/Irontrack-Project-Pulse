"use client";

import { type ReactNode } from "react";

interface RollupStatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  subtext?: string;
  accent?: boolean;
}

export default function RollupStatCard({ label, value, icon, subtext, accent }: RollupStatCardProps) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-col items-center text-center min-w-[100px]">
      {icon && <div className="mb-1 text-gray-500">{icon}</div>}
      <div className={`text-2xl font-bold ${accent ? "text-[#F97316]" : "text-white"}`}>
        {value}
      </div>
      <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
      {subtext && <div className="text-[10px] text-gray-600 mt-0.5">{subtext}</div>}
    </div>
  );
}
