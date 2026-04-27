"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sun, Cloud, CloudRain, CloudLightning, Wind, Thermometer,
  Snowflake, AlertTriangle, Users, Minus, Plus, X, ChevronDown, ChevronUp,
  Check, RefreshCw,
} from "lucide-react";
import type { DailyLogWeather, DailyLogCrewEntry, WeatherCondition, WeatherImpact } from "@/types";
import { t } from "@/lib/i18n";

/* ── Weather code → label + icon mapping ── */
function weatherCodeToInfo(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: t('ui.clear.sky'), emoji: "☀️" };
  if (code <= 3) return { label: t('ui.partly.cloudy'), emoji: "⛅" };
  if (code <= 49) return { label: t('ui.foggy'), emoji: "🌫️" };
  if (code <= 59) return { label: t('ui.drizzle'), emoji: "🌦️" };
  if (code <= 69) return { label: t('ui.rain'), emoji: "🌧️" };
  if (code <= 79) return { label: t('ui.snow'), emoji: "❄️" };
  if (code <= 84) return { label: t('ui.rain.showers'), emoji: "🌧️" };
  if (code <= 86) return { label: t('ui.snow.showers'), emoji: "🌨️" };
  if (code <= 99) return { label: t('ui.thunderstorm'), emoji: "⛈️" };
  return { label: t('ui.unknown'), emoji: "❓" };
}

const CONDITION_CHIPS: { label: WeatherCondition; labelKey: string; icon: typeof Sun }[] = [
  { label: "Sunny", labelKey: "ui.sunny", icon: Sun },
  { label: "Partly Cloudy", labelKey: "ui.partly.cloudy", icon: Cloud },
  { label: "Overcast", labelKey: "ui.overcast", icon: Cloud },
  { label: "Rain", labelKey: "ui.rain", icon: CloudRain },
  { label: "Storm", labelKey: "ui.storm", icon: CloudLightning },
  { label: "High Wind", labelKey: "ui.high.wind", icon: Wind },
  { label: "Freeze", labelKey: "ui.freeze", icon: Snowflake },
  { label: "Heat Advisory", labelKey: "ui.heat.advisory", icon: AlertTriangle },
];

const IMPACT_BUTTONS: { value: WeatherImpact; label: string; emoji: string }[] = [
  { value: "none", label: t('ui.no.impact'), emoji: "☀️" },
  { value: "minor_slowdown", label: t('ui.slowed.us'), emoji: "🌧️" },
  { value: "partial_stop", label: t('ui.partial.stop'), emoji: "⛈️" },
  { value: "full_stop", label: t('ui.full.stop'), emoji: "🚫" },
];

function impactColor(value: WeatherImpact, active: boolean): string {
  if (!active) return "bg-[var(--bg-secondary)] text-[color:var(--text-muted)] border-[var(--border-primary)]";
  switch (value) {
    case "none": return "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40";
    case "minor_slowdown": return "bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/40";
    case "partial_stop": return "bg-[#F97316]/15 text-[#F97316] border-[#F97316]/40";
    case "full_stop": return "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/40";
  }
}

/* ── Weather fetch hook ── */
function useWeatherFetch(lat: number, lon: number) {
  const [data, setData] = useState<{
    temp: number; windSpeed: number; weatherCode: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Phoenix`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Weather API error");
        return r.json();
      })
      .then((json) => {
        setData({
          temp: Math.round(json.current.temperature_2m),
          windSpeed: Math.round(json.current.wind_speed_10m),
          weatherCode: json.current.weather_code,
        });
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [lat, lon]);

  return { data, loading, error };
}

/* ── Stepper Component ── */
function Stepper({
  value,
  onChange,
  label,
  step = 1,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  step?: number;
  min?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-[color:var(--text-muted)] uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-11 h-11 flex items-center justify-center rounded-l-xl
            bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-secondary)]
            hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-hover)] transition-colors"
        >
          <Minus size={16} />
        </button>
        <div className="w-14 h-11 flex items-center justify-center
          bg-[var(--bg-primary)] border-t border-b border-[var(--border-primary)] text-[color:var(--text-primary)] font-bold text-lg">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="w-11 h-11 flex items-center justify-center rounded-r-xl
            bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-secondary)]
            hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-hover)] transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ── */
interface SnapshotScreenProps {
  weather: DailyLogWeather;
  onWeatherChange: (w: DailyLogWeather) => void;
  crew: DailyLogCrewEntry[];
  onCrewChange: (c: DailyLogCrewEntry[]) => void;
  projectLat?: number;
  projectLon?: number;
  usingDefaultLocation?: boolean;
}

export default function SnapshotScreen({
  weather,
  onWeatherChange,
  crew,
  onCrewChange,
  projectLat = 33.4484,
  projectLon = -112.074,
  usingDefaultLocation = false,
}: SnapshotScreenProps) {
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [newTrade, setNewTrade] = useState("");
  const [newCompany, setNewCompany] = useState("");

  const { data: liveWeather, loading: weatherLoading, error: weatherError } =
    useWeatherFetch(projectLat, projectLon);

  // Auto-populate weather from API when we get it (only if not already confirmed)
  useEffect(() => {
    if (liveWeather && !weather.confirmed) {
      const info = weatherCodeToInfo(liveWeather.weatherCode);
      onWeatherChange({
        ...weather,
        current_temp: liveWeather.temp,
        wind_speed: liveWeather.windSpeed,
        weather_code: liveWeather.weatherCode,
        high: liveWeather.temp, // Use current as high initially
        source: "open-meteo",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveWeather]);

  // If weather API fails, auto-expand for manual entry
  useEffect(() => {
    if (weatherError) setWeatherExpanded(true);
  }, [weatherError]);

  const handleConfirmWeather = () => {
    onWeatherChange({ ...weather, confirmed: true });
  };

  const toggleCondition = (cond: WeatherCondition) => {
    const conditions = weather.conditions || [];
    const updated = conditions.includes(cond)
      ? conditions.filter((c) => c !== cond)
      : [...conditions, cond];
    onWeatherChange({ ...weather, conditions: updated });
  };

  const updateCrewEntry = (index: number, field: keyof DailyLogCrewEntry, value: string | number) => {
    const updated = [...crew];
    updated[index] = { ...updated[index], [field]: value };
    onCrewChange(updated);
  };

  const removeCrewEntry = (index: number) => {
    onCrewChange(crew.filter((_, i) => i !== index));
  };

  const addCrewEntry = () => {
    if (!newTrade.trim()) return;
    onCrewChange([...crew, { trade: newTrade.trim(), company: newCompany.trim(), headcount: 0, hours: 8 }]);
    setNewTrade("");
    setNewCompany("");
    setShowAddTrade(false);
  };

  const totalHeadcount = crew.reduce((sum, c) => sum + (c.headcount || 0), 0);
  const totalHours = crew.reduce((sum, c) => sum + ((c.headcount || 0) * (c.hours || 0)), 0);

  const weatherInfo = weather.weather_code != null
    ? weatherCodeToInfo(weather.weather_code)
    : null;

  return (
    <div className="space-y-6">
      {/* ─── WEATHER SECTION ─── */}
      <div>
        <h3 className="text-sm font-semibold text-[color:var(--text-primary)] mb-3 flex items-center gap-2">
          <Thermometer size={16} className="text-[#F97316]" />{t('ui.weather')}
        </h3>

        {weatherLoading ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 flex items-center justify-center gap-3">
            <RefreshCw size={18} className="text-[#F97316] animate-spin" />
            <span className="text-sm text-[color:var(--text-secondary)]">{t('ui.fetching.weather')}</span>
          </div>
        ) : weatherError ? (
          <div className="bg-[var(--bg-secondary)] border border-[#EAB308]/30 rounded-2xl p-4 mb-3">
            <p className="text-sm text-[#EAB308] mb-1">{t('ui.weather.unavailable.enter.manually')}</p>
            <p className="text-xs text-[color:var(--text-muted)]">{t('ui.could.not.reach.weather.service')}</p>
          </div>
        ) : (
          <>
            {/* Weather Card — tappable to expand/edit */}
            <button
              type="button"
              onClick={() => setWeatherExpanded(!weatherExpanded)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5
                flex items-center justify-between transition-colors hover:border-[var(--border-secondary)]"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{weatherInfo?.emoji || "🌤️"}</span>
                <div className="text-left">
                  <div className="text-2xl font-bold text-[color:var(--text-primary)]">
                    {weather.current_temp ?? "--"}{t('ui.f')}
                  </div>
                  <div className="text-sm text-[color:var(--text-secondary)]">
                    {weatherInfo?.label || t('ui.conditions.unknown')}
                    {weather.wind_speed != null && (
                      <span className="text-[color:var(--text-muted)]"> · {weather.wind_speed}{t('ui.mph.wind')}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-[color:var(--text-muted)]">
                {weatherExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {usingDefaultLocation && (
              <p className="text-xs text-[#EAB308]/70 mt-1.5 ml-1">{t('ui.using.phoenix.weather.set.project.location.for.accuracy')}
              </p>
            )}

            {/* Expanded edit fields */}
            {weatherExpanded && (
              <div className="mt-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.high.f')}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={weather.high ?? ""}
                      onChange={(e) => onWeatherChange({ ...weather, high: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm text-[color:var(--text-primary)]
                        focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
                      placeholder="--"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.low.f')}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={weather.low ?? ""}
                      onChange={(e) => onWeatherChange({ ...weather, low: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm text-[color:var(--text-primary)]
                        focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
                      placeholder="--"
                    />
                  </div>
                </div>
                {/* Condition chips */}
                <div>
                  <label className="text-xs text-[color:var(--text-muted)] mb-1.5 block">{t('ui.conditions')}</label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_CHIPS.map(({ label, labelKey, icon: Icon }) => {
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
                              : "bg-[var(--bg-primary)] text-[color:var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
                            }`}
                        >
                          <Icon size={14} />
                          {t(labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* "Looks right" confirm button */}
            {!weather.confirmed && (
              <button
                type="button"
                onClick={handleConfirmWeather}
                className="mt-3 w-full py-3.5 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40
                  text-[#22C55E] font-semibold text-sm hover:bg-[#22C55E]/25
                  active:scale-[0.98] transition-all min-h-[48px]
                  flex items-center justify-center gap-2"
              >
                <Check size={18} />{t('ui.looks.right')}
              </button>
            )}
            {weather.confirmed && (
              <div className="mt-3 w-full py-2.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20
                text-[#22C55E]/70 text-sm text-center flex items-center justify-center gap-2">
                <Check size={16} />{t('ui.weather.confirmed')}
              </div>
            )}
          </>
        )}

        {/* Weather Impact buttons — always visible */}
        <div className="mt-4">
          <label className="text-xs text-[color:var(--text-muted)] mb-2 block">{t('ui.weather.impact.on.work')}</label>
          <div className="grid grid-cols-4 gap-2">
            {IMPACT_BUTTONS.map(({ value, label, emoji }) => {
              const active = weather.impact === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onWeatherChange({ ...weather, impact: value })}
                  className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-medium
                    border transition-all min-h-[64px] active:scale-[0.96]
                    ${impactColor(value, active)}`}
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="leading-tight text-center">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── CREW / MANPOWER SECTION ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[color:var(--text-primary)] flex items-center gap-2">
            <Users size={16} className="text-[#3B82F6]" />{t('ui.crew.on.site')}
          </h3>
        </div>

        {/* Crew cards */}
        <div className="space-y-3">
          {crew.map((entry, i) => (
            <div
              key={i}
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-4 relative group"
            >
              {/* Remove button — top right corner */}
              <button
                type="button"
                onClick={() => removeCrewEntry(i)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)]
                  flex items-center justify-center text-red-400/50 hover:text-red-400
                  hover:border-red-400/40 transition-colors"
              >
                <X size={14} />
              </button>

              {/* Trade + Company */}
              <div className="mb-3 pr-8">
                <div className="text-sm font-bold text-[color:var(--text-primary)]">{entry.trade || t('ui.untitled.trade')}</div>
                {entry.company && (
                  <div className="text-xs text-[color:var(--text-muted)]">{entry.company}</div>
                )}
              </div>

              {/* Steppers row */}
              <div className="flex items-center justify-around">
                <Stepper
                  label={t('ui.headcount')}
                  value={entry.headcount || 0}
                  onChange={(v) => updateCrewEntry(i, "headcount", v)}
                />
                <Stepper
                  label={t('ui.hours')}
                  value={entry.hours || 0}
                  onChange={(v) => updateCrewEntry(i, "hours", v)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Trade */}
        {showAddTrade ? (
          <div className="mt-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-4 space-y-3">
            <input
              type="text"
              value={newTrade}
              onChange={(e) => setNewTrade(e.target.value)}
              placeholder={t('ui.trade.name.e.g.electrical')}
              autoFocus
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm text-[color:var(--text-primary)]
                focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
            />
            <input
              type="text"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder={t('ui.company.name.optional')}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm text-[color:var(--text-primary)]
                focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addCrewEntry}
                disabled={!newTrade.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#F97316] text-[color:var(--text-primary)] text-sm font-medium
                  hover:bg-[#ea6c10] disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[44px]"
              >{t('action.add')}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddTrade(false); setNewTrade(""); setNewCompany(""); }}
                className="flex-1 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] text-sm
                  hover:bg-[var(--bg-hover)] transition-colors min-h-[44px]"
              >{t('action.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddTrade(true)}
            className="mt-3 w-full py-3 rounded-xl border border-dashed border-[var(--border-primary)] text-sm
              text-[color:var(--text-muted)] hover:text-[#F97316] hover:border-[#F97316]/30 transition-colors min-h-[44px]"
          >{t('ui.add.trade')}
          </button>
        )}

        {/* Summary line */}
        {crew.length > 0 && (
          <div className="mt-3 flex items-center justify-center gap-6 py-2.5 rounded-xl
            bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm">
            <span className="text-[color:var(--text-secondary)]">
              <span className="font-bold text-[color:var(--text-primary)]">{totalHeadcount}</span>{t('ui.workers.f74e09')}
            </span>
            <span className="text-[#1F1F25]">|</span>
            <span className="text-[color:var(--text-secondary)]">
              <span className="font-bold text-[color:var(--text-primary)]">{totalHours.toLocaleString()}</span>{t('ui.crew.hours.e2ddc1')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
