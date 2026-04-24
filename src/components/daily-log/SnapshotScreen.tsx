"use client";

import { Sun, Cloud, CloudRain, CloudLightning, Wind, Thermometer, Snowflake, AlertTriangle, Users } from "lucide-react";
import type { DailyLogWeather, DailyLogCrewEntry, WeatherCondition, WeatherImpact } from "@/types";

const CONDITION_CHIPS: { label: WeatherCondition; icon: any }[] = [
  { label: "Sunny", icon: Sun },
  { label: "Partly Cloudy", icon: Cloud },
  { label: "Overcast", icon: Cloud },
  { label: "Rain", icon: CloudRain },
  { label: "Storm", icon: CloudLightning },
  { label: "High Wind", icon: Wind },
  { label: "Freeze", icon: Snowflake },
  { label: "Heat Advisory", icon: AlertTriangle },
];

const IMPACT_OPTIONS: { value: WeatherImpact; label: string; color: string }[] = [
  { value: "none", label: "No Impact", color: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30" },
  { value: "minor_slowdown", label: "Minor Slowdown", color: "bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/30" },
  { value: "partial_stop", label: "Partial Stop", color: "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30" },
  { value: "full_stop", label: "Full Stop", color: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30" },
];

interface SnapshotScreenProps {
  weather: DailyLogWeather;
  onWeatherChange: (w: DailyLogWeather) => void;
  crew: DailyLogCrewEntry[];
  onCrewChange: (c: DailyLogCrewEntry[]) => void;
}

export default function SnapshotScreen({
  weather,
  onWeatherChange,
  crew,
  onCrewChange,
}: SnapshotScreenProps) {
  const toggleCondition = (cond: WeatherCondition) => {
    const conditions = weather.conditions || [];
    const updated = conditions.includes(cond)
      ? conditions.filter((c) => c !== cond)
      : [...conditions, cond];
    onWeatherChange({ ...weather, conditions: updated });
  };

  const updateCrewEntry = (index: number, field: keyof DailyLogCrewEntry, value: any) => {
    const updated = [...crew];
    updated[index] = { ...updated[index], [field]: value };
    onCrewChange(updated);
  };

  const addCrewEntry = () => {
    onCrewChange([...crew, { trade: "", company: "", headcount: 0, hours: 0 }]);
  };

  const removeCrewEntry = (index: number) => {
    onCrewChange(crew.filter((_, i) => i !== index));
  };

  const totalHeadcount = crew.reduce((sum, c) => sum + (c.headcount || 0), 0);
  const totalHours = crew.reduce((sum, c) => sum + ((c.headcount || 0) * (c.hours || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Weather Section */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Thermometer size={16} className="text-[#F97316]" />
          Weather
        </h3>

        {/* Temp inputs */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">High °F</label>
            <input
              type="number"
              inputMode="numeric"
              value={weather.high ?? ""}
              onChange={(e) => onWeatherChange({ ...weather, high: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-3 text-sm text-white
                focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
              placeholder="--"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Low °F</label>
            <input
              type="number"
              inputMode="numeric"
              value={weather.low ?? ""}
              onChange={(e) => onWeatherChange({ ...weather, low: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-3 text-sm text-white
                focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
              placeholder="--"
            />
          </div>
        </div>

        {/* Condition chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CONDITION_CHIPS.map(({ label, icon: Icon }) => {
            const active = (weather.conditions || []).includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleCondition(label)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium
                  transition-all min-h-[36px] border
                  ${active
                    ? "bg-[#F97316]/15 text-[#F97316] border-[#F97316]/40"
                    : "bg-[#121217] text-gray-400 border-[#1F1F25] hover:border-[#2a2a35]"
                  }`}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Weather impact */}
        <label className="text-xs text-gray-500 mb-2 block">Weather Impact</label>
        <div className="grid grid-cols-2 gap-2">
          {IMPACT_OPTIONS.map(({ value, label, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => onWeatherChange({ ...weather, impact: value })}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all min-h-[44px]
                ${weather.impact === value ? color : "bg-[#121217] text-gray-500 border-[#1F1F25]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Crew Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users size={16} className="text-[#3B82F6]" />
            Crew on Site
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{totalHeadcount} workers</span>
            <span>{totalHours} crew-hrs</span>
          </div>
        </div>

        <div className="space-y-3">
          {crew.map((entry, i) => (
            <div key={i} className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={entry.trade}
                  onChange={(e) => updateCrewEntry(i, "trade", e.target.value)}
                  placeholder="Trade"
                  className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-sm text-white
                    focus:outline-none focus:border-[#F97316]/50 min-h-[40px]"
                />
                <input
                  type="text"
                  value={entry.company}
                  onChange={(e) => updateCrewEntry(i, "company", e.target.value)}
                  placeholder="Company"
                  className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-sm text-white
                    focus:outline-none focus:border-[#F97316]/50 min-h-[40px]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-600 mb-0.5 block">Headcount</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={entry.headcount || ""}
                    onChange={(e) => updateCrewEntry(i, "headcount", parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-sm text-white
                      focus:outline-none focus:border-[#F97316]/50 min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 mb-0.5 block">Hours</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={entry.hours || ""}
                    onChange={(e) => updateCrewEntry(i, "hours", parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-sm text-white
                      focus:outline-none focus:border-[#F97316]/50 min-h-[40px]"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeCrewEntry(i)}
                    className="w-full text-xs text-red-400/60 hover:text-red-400 py-2 transition-colors min-h-[40px]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addCrewEntry}
          className="mt-3 w-full py-3 rounded-xl border border-dashed border-[#1F1F25] text-sm
            text-gray-500 hover:text-[#F97316] hover:border-[#F97316]/30 transition-colors min-h-[44px]"
        >
          + Add Trade
        </button>
      </div>
    </div>
  );
}
