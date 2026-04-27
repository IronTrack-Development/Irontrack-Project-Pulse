"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, Save, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import SnapshotScreen from "./SnapshotScreen";
import WorkIssuesScreen from "./WorkIssuesScreen";
import PhotosSubmitScreen from "./PhotosSubmitScreen";
import { saveDraft, loadDraft, deleteDraft } from "@/lib/daily-log-offline";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();
import type {
  DailyLog, DailyLogWeather, DailyLogCrewEntry, DailyLogProgress,
  DailyLogPhoto, DelayCode, ParsedActivity,
} from "@/types";

interface DailyLogWizardProps {
  projectId: string;
  projectName: string;
  logDate: string;
  existingLogId?: string;
  projectLat?: number;
  projectLon?: number;
}

const SCREENS = ["Snapshot", "Work & Issues", "Photos & Submit"];

export default function DailyLogWizard({
  projectId,
  projectName,
  logDate,
  existingLogId,
  projectLat,
  projectLon,
}: DailyLogWizardProps) {
  const [screen, setScreen] = useState(0);
  const [logId, setLogId] = useState(existingLogId || "");
  const [logStatus, setLogStatus] = useState("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [activities, setActivities] = useState<ParsedActivity[]>([]);

  // Determine lat/lon: use project values or default to Phoenix
  const lat = projectLat ?? 33.4484;
  const lon = projectLon ?? -112.074;
  const usingDefaultLocation = !projectLat || !projectLon;

  // Form state
  const [weather, setWeather] = useState<DailyLogWeather>({
    conditions: [],
    impact: "none",
  });
  const [crew, setCrew] = useState<DailyLogCrewEntry[]>([]);
  const [progress, setProgress] = useState<DailyLogProgress[]>([]);
  const [delayCodes, setDelayCodes] = useState<DelayCode[]>([]);
  const [delayNarrative, setDelayNarrative] = useState("");
  const [lostCrewHours, setLostCrewHours] = useState(0);
  const [photos, setPhotos] = useState<(DailyLogPhoto & { localUrl?: string; file?: File })[]>([]);

  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  const crewPreFilled = useRef(false);

  // Online/offline detection
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Load activities for this project
  useEffect(() => {
    fetch(`/api/projects/${projectId}/activities`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setActivities(Array.isArray(data) ? data : data.activities || []))
      .catch(() => {});
  }, [projectId]);

  // Pre-fill crew from yesterday's log (most recent log for this project)
  useEffect(() => {
    if (crewPreFilled.current) return;
    if (existingLogId) return; // Don't pre-fill if loading an existing log

    async function prefillCrew() {
      try {
        const res = await fetch(`/api/projects/${projectId}/daily-logs?limit=1&offset=0`);
        if (!res.ok) return;
        const data = await res.json();
        const logs = data.logs || [];
        if (logs.length > 0 && logs[0].crew && logs[0].crew.length > 0) {
          // Only set if crew is currently empty (haven't loaded from draft or server yet)
          setCrew((current) => {
            if (current.length === 0) {
              crewPreFilled.current = true;
              return logs[0].crew;
            }
            return current;
          });
        }
      } catch {
        // Silently fail — crew pre-fill is a nice-to-have
      }
    }
    prefillCrew();
  }, [projectId, existingLogId]);

  // Load existing log or offline draft
  useEffect(() => {
    async function loadData() {
      // Try to load from server first
      if (existingLogId) {
        try {
          const res = await fetch(`/api/projects/${projectId}/daily-logs/${existingLogId}`);
          if (res.ok) {
            const data = await res.json();
            setLogId(data.id);
            setLogStatus(data.status);
            setWeather(data.weather || { conditions: [], impact: "none" });
            setCrew(data.crew || []);
            setProgress(data.progress || []);
            setDelayCodes(data.delay_codes || []);
            setDelayNarrative(data.delay_narrative || "");
            setLostCrewHours(data.lost_crew_hours || 0);
            crewPreFilled.current = true; // Mark as loaded
            return;
          }
        } catch {}
      }

      // Try offline draft
      const draft = await loadDraft(projectId, logDate);
      if (draft) {
        if (draft.weather) setWeather(draft.weather);
        if (draft.crew) { setCrew(draft.crew); crewPreFilled.current = true; }
        if (draft.progress) setProgress(draft.progress);
        if (draft.delayCodes) setDelayCodes(draft.delayCodes);
        if (draft.delayNarrative) setDelayNarrative(draft.delayNarrative);
        if (draft.lostCrewHours) setLostCrewHours(draft.lostCrewHours);
        if (draft.logId) setLogId(draft.logId);
      }
    }
    loadData();
  }, [projectId, logDate, existingLogId]);

  // Autosave to IndexedDB on any change (debounced)
  const saveToLocal = useCallback(async () => {
    await saveDraft(projectId, logDate, {
      weather,
      crew,
      progress,
      delayCodes,
      delayNarrative,
      lostCrewHours,
      logId,
    });
  }, [projectId, logDate, weather, crew, progress, delayCodes, delayNarrative, lostCrewHours, logId]);

  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveToLocal();
    }, 1000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [saveToLocal]);

  // Save to server (autosave on screen change + periodic)
  const saveToServer = useCallback(async () => {
    if (!isOnline) return;
    setIsSaving(true);

    try {
      const body = {
        log_date: logDate,
        weather,
        crew,
        delay_codes: delayCodes,
        delay_narrative: delayNarrative,
        lost_crew_hours: lostCrewHours,
      };

      let res: Response;
      if (logId) {
        res = await fetch(`/api/projects/${projectId}/daily-logs/${logId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/projects/${projectId}/daily-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (!logId && data.id) setLogId(data.id);
        setLastSaved(new Date().toLocaleTimeString());

        // Save progress entries if we have a log ID
        const currentLogId = logId || data.id;
        if (currentLogId && progress.length > 0) {
          await fetch(`/api/projects/${projectId}/daily-logs/${currentLogId}/progress`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entries: progress.map((p) => ({
                activity_id: p.activity_id,
                pct_complete_before: p.pct_complete_before,
                pct_complete_after: p.pct_complete_after,
                note: p.note,
              })),
            }),
          });
        }
      }
    } catch (e) {
      console.warn("Server save failed, data preserved locally", e);
    } finally {
      setIsSaving(false);
    }
  }, [isOnline, logId, logDate, projectId, weather, crew, delayCodes, delayNarrative, lostCrewHours, progress]);

  // Auto-save to server every 12 seconds on desktop
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && logStatus === "draft") {
        saveToServer();
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [isOnline, logStatus, saveToServer]);

  // Save to server on screen change
  const goToScreen = (newScreen: number) => {
    if (logStatus === "draft") saveToServer();
    setScreen(newScreen);
  };

  // Submit handler — returns boolean for success/failure
  const handleSubmit = async (): Promise<boolean> => {
    if (!isOnline) {
      alert(t('ui.you.re.offline.your.log.is.saved.locally.and.will'));
      return false;
    }

    setIsSubmitting(true);
    try {
      // Save all data first
      await saveToServer();
      const currentLogId = logId;
      if (!currentLogId) throw new Error("Log not saved yet");

      // Upload photos
      for (const photo of photos) {
        if (photo.file) {
          const formData = new FormData();
          formData.append("file", photo.file);
          if (photo.activity_id) formData.append("activity_id", photo.activity_id);
          if (photo.caption) formData.append("caption", photo.caption);

          await fetch(`/api/projects/${projectId}/daily-logs/${currentLogId}/upload-photo`, {
            method: "POST",
            body: formData,
          });
        }
      }

      // Submit the log (set status + submitted_at)
      const res = await fetch(`/api/projects/${projectId}/daily-logs/${currentLogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      });

      if (res.ok) {
        setLogStatus("submitted");
        await deleteDraft(projectId, logDate);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Submit failed:", e);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F25]">
        <div className="px-4 pt-3 pb-0 max-w-2xl mx-auto">
          {/* Top row */}
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center gap-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] text-sm transition-colors min-h-[44px]"
            >
              <ChevronLeft size={16} />{t('action.back')}
            </Link>
            <div className="flex items-center gap-2 text-xs">
              {/* Online/offline indicator */}
              {isOnline ? (
                <span className="flex items-center gap-1 text-[#22C55E]/60">
                  <Wifi size={12} />
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#EAB308]">
                  <WifiOff size={12} />{t('ui.offline')}
                </span>
              )}
              {/* Save indicator */}
              {isSaving && (
                <span className="flex items-center gap-1 text-[color:var(--text-muted)]">
                  <Save size={12} className="animate-pulse" />{t('ui.saving')}
                </span>
              )}
              {lastSaved && !isSaving && (
                <span className="text-gray-600">{t('ui.saved')} {lastSaved}</span>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mb-2">
            <h1 className="text-lg font-bold text-[color:var(--text-primary)]">{t('ui.daily.log')}</h1>
            <p className="text-xs text-[color:var(--text-muted)]">
              {projectName} · {new Date(logDate + t('ui.t12.00.00')).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Screen indicator tabs */}
          <div className="flex gap-0">
            {SCREENS.map((label, i) => (
              <button
                key={label}
                onClick={() => goToScreen(i)}
                className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-all min-h-[40px]
                  ${screen === i
                    ? "border-[#F97316] text-[#F97316]"
                    : "border-transparent text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Screen content */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {screen === 0 && (
          <SnapshotScreen
            weather={weather}
            onWeatherChange={setWeather}
            crew={crew}
            onCrewChange={setCrew}
            projectLat={lat}
            projectLon={lon}
            usingDefaultLocation={usingDefaultLocation}
          />
        )}
        {screen === 1 && (
          <WorkIssuesScreen
            activities={activities}
            progress={progress}
            onProgressChange={setProgress}
            delayCodes={delayCodes}
            onDelayCodesChange={setDelayCodes}
            delayNarrative={delayNarrative}
            onDelayNarrativeChange={setDelayNarrative}
            lostCrewHours={lostCrewHours}
            onLostCrewHoursChange={setLostCrewHours}
          />
        )}
        {screen === 2 && (
          <PhotosSubmitScreen
            photos={photos}
            onPhotosChange={setPhotos}
            activities={activities}
            weather={weather}
            crew={crew}
            progress={progress}
            delayCodes={delayCodes}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            logStatus={logStatus}
            projectId={projectId}
            logDate={logDate}
          />
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6 pb-8">
          {screen > 0 && (
            <button
              type="button"
              onClick={() => goToScreen(screen - 1)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl
                bg-[#1F1F25] text-[color:var(--text-secondary)] hover:bg-[#2a2a35] transition-colors min-h-[48px]"
            >
              <ArrowLeft size={16} />{t('action.back')}
            </button>
          )}
          {screen < SCREENS.length - 1 && (
            <button
              type="button"
              onClick={() => goToScreen(screen + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl
                bg-[#F97316] text-[color:var(--text-primary)] hover:bg-[#ea6c10] transition-colors min-h-[48px] font-medium"
            >{t('ui.next')}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
