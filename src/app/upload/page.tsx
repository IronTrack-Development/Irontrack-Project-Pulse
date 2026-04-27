"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Upload, FileSpreadsheet, CheckCircle, AlertTriangle,
  ArrowRight, X, Plus, Loader2
} from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { SupportButton } from "@/components/support-button";
import { createClient } from "@/lib/supabase-browser";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface Project { id: string; name: string; }

function UploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedProjectId = searchParams.get("project") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<{
    activities_parsed: number;
    milestones_found: number;
    risks_detected: number;
    health_score: number;
    project_id: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"select" | "uploading" | "done">("select");

  const fileRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
    setIsMobile(check);
  }, []);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProjects(data); });
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      if (f.size > 100 * 1024 * 1024) {
        setError(t('ui.file.too.large.maximum.file.size.is.100mb'));
        return;
      }
      setFile(f);
      setError("");
    }
  };

  // Validate file type client-side (since mobile accept attr is unreliable)
  const isValidFileType = (f: File): boolean => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    return ["xlsx", "xls", "csv", "mpp", "xml", "xer"].includes(ext);
  };

  const autoDetectMapping = async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    const buf = await f.arrayBuffer();
    let columns: string[] = [];

    if (ext === "csv") {
      const text = new TextDecoder().decode(buf);
      const result = Papa.parse(text, { header: true, preview: 1 });
      columns = result.meta.fields || [];
    } else if (ext === "xlsx" || ext === "xls") {
      const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
      if (rows.length > 0) columns = (rows[0] as unknown[]).map(String);
    }

    // For PDFs and MPPs, return empty mapping — server handles parsing
    if (columns.length === 0) return {};

    const mapping: Record<string, string> = {};
    const tryMap = (field: string, patterns: string[]) => {
      for (const col of columns) {
        const lower = col.toLowerCase().replace(/[\s_\-()]/g, "");
        for (const p of patterns) {
          if (lower.includes(p.replace(/[\s_\-()]/g, ""))) {
            mapping[field] = col;
            return;
          }
        }
      }
    };

    // Exact match first (normalized), then partial — avoids "Task Mode" matching before "Task Name"
    const exactMap = (field: string, exactPatterns: string[]) => {
      for (const col of columns) {
        const lower = col.toLowerCase().replace(/[\s_\-()]/g, "");
        for (const p of exactPatterns) {
          if (lower === p.replace(/[\s_\-()]/g, "")) {
            mapping[field] = col;
            return;
          }
        }
      }
    };

    // Priority: exact matches first
    exactMap("activity_name", ["task name", "taskname", "activity name", "activityname", "activity description", "description", "name"]);
    exactMap("start_date", ["start", "start date", "early start", "planned start", "plan start"]);
    exactMap("finish_date", ["finish", "finish date", "early finish", "planned finish", "end date", "plan finish"]);
    exactMap("percent_complete", ["% complete", "percent complete", "pct complete", "complete %", "progress"]);
    exactMap("original_duration", ["duration", "original duration"]);
    exactMap("activity_id", ["activity id", "task id", "id", "wbs"]);

    // Fallback: partial matches for anything not yet mapped
    if (!mapping.activity_name) tryMap("activity_name", ["taskname", "activityname", "activitydescription", "description"]);
    if (!mapping.start_date) tryMap("start_date", ["start", "begin"]);
    if (!mapping.finish_date) tryMap("finish_date", ["finish", "end", "completion"]);

    return mapping;
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName }),
    });
    if (res.ok) {
      const p = await res.json();
      setProjects([p, ...projects]);
      setSelectedProjectId(p.id);
      setShowNewProject(false);
      setNewProjectName("");
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedProjectId) return setError(t('ui.select.a.project.and.file'));
    setUploading(true);
    setStep("uploading");
    setError("");
    setUploadProgress(0);

    // Auto-detect columns — no user input needed
    const mapping = await autoDetectMapping(file);

    // Retry helper for flaky mobile connections
    const fetchWithRetry = async (url: string, options: RequestInit, retries = 2): Promise<Response> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const res = await fetch(url, options);
          if (res.ok || res.status < 500) return res; // Don't retry client errors
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          return res;
        } catch (err) {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          throw err;
        }
      }
      throw new Error("Upload failed after retries");
    };

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError(t('ui.please.log.in.to.upload.files'));
        setUploading(false);
        setStep("select");
        return;
      }

      // For files larger than 4MB, use two-step flow (Supabase Storage → API)
      const USE_TWO_STEP = file.size > 4 * 1024 * 1024;

      if (USE_TWO_STEP) {
        setUploadProgress(5);

        // Step 1a: Get signed upload URL from server (bypasses RLS)
        const signedRes = await fetchWithRetry('/api/storage-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, user_id: user.id }),
        });
        const signedData = await signedRes.json();
        if (!signedRes.ok || !signedData.signed_url) {
          setError(`Failed to prepare upload: ${signedData.error || 'Unknown error'}`);
          setUploading(false);
          setStep("select");
          return;
        }

        setUploadProgress(10); // Got signed URL

        // Step 1b: Upload directly to Supabase Storage using signed URL
        const storagePath = signedData.storage_path;
        const uploadRes = await fetchWithRetry(signedData.signed_url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        }, 1);

        if (!uploadRes.ok) {
          console.error('Storage upload error:', uploadRes.status, await uploadRes.text());
          setError(t('ui.file.upload.failed.check.your.connection.and.try.again'));
          setUploading(false);
          setStep("select");
          return;
        }

        setUploadProgress(50); // Upload complete, now processing

        // Step 2: Call API with storage path
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 180000); // 3 min timeout for mobile
        
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storage_path: storagePath,
            project_id: selectedProjectId,
            mapping: mapping,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        const data = await res.json();
        setUploading(false);
        setUploadProgress(100);

        if (!res.ok) {
          setError(data.error || "Processing failed. Try exporting your schedule as .xlsx for best results.");
          setStep("select");
          return;
        }
        setResult(data);
        setStep("done");
      } else {
        // Small file or mobile: use FormData flow (most compatible)
        setUploadProgress(10);
        const fd = new FormData();
        fd.append("file", file);
        fd.append("project_id", selectedProjectId);
        fd.append("mapping", JSON.stringify(mapping));

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 180000); // 3 min for mobile
        
        setUploadProgress(30);
        const res = await fetchWithRetry("/api/upload", { method: "POST", body: fd, signal: controller.signal }, 1);
        clearTimeout(timeout);
        const data = await res.json();
        setUploading(false);
        setUploadProgress(100);

        if (!res.ok) {
          setError(data.error || "Upload failed. Try exporting your schedule as .xlsx for best results.");
          setStep("select");
          return;
        }
        setResult(data);
        setStep("done");
      }
    } catch (err) {
      setUploading(false);
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("abort")) {
        setError(t('ui.upload.timed.out.check.your.connection.or.try.a.smaller'));
      } else if (msg.includes("NetworkError") || msg.includes("Failed to fetch") || msg.includes("network")) {
        setError(t('ui.network.error.check.your.connection.and.try.again.if.on'));
      } else {
        setError(`Upload failed: ${msg}`);
      }
      setStep("select");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      <div className="sticky top-0 z-10 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F25] px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg md:text-xl font-bold text-[color:var(--text-primary)]">{t('ui.upload.schedule')}</h1>
          <p className="text-xs md:text-sm text-[color:var(--text-muted)] mt-0.5">{isMobile ? t('ui.select.your.schedule.file.below') : t('ui.drop.your.schedule.file.and.we.ll.handle.the.rest')}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-4 md:space-y-6">
        {/* Step 1: Select project + file + upload */}
        {step === "select" && (
          <>
            {/* Project selector */}
            <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6">
              <h2 className="font-semibold text-[color:var(--text-primary)] mb-4">{t('ui.1.select.project')}</h2>
              {showNewProject ? (
                <div className="flex gap-2">
                  <input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder={t('ui.new.project.name')}
                    className="flex-1 bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50"
                    onKeyDown={(e) => e.key === "Enter" && createProject()}
                  />
                  <button onClick={createProject} className="px-4 py-2 bg-[#F97316] text-[color:var(--text-primary)] rounded-lg text-sm font-semibold">{t('ui.create.6e157c')}
                  </button>
                  <button onClick={() => setShowNewProject(false)} className="px-3 py-2 bg-[#1F1F25] text-[color:var(--text-secondary)] rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="flex-1 bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50"
                  >
                    <option value="">{t('ui.select.a.project')}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-sm transition-colors"
                  >
                    <Plus size={14} />{t('ui.new.6403f2')}
                  </button>
                </div>
              )}
            </div>

            {/* File drop/select zone — mobile-optimized */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl ${isMobile ? 'p-8' : 'p-12'} text-center cursor-pointer transition-colors group active:scale-[0.99] ${
                file ? "border-[#22C55E]/40 bg-[#22C55E]/5" : "border-[#1F1F25] hover:border-[#F97316]/40 active:border-[#F97316]/60"
              }`}
            >
              {file ? (
                <>
                  <CheckCircle size={isMobile ? 32 : 40} className="mx-auto text-[#22C55E] mb-3" />
                  <div className="text-[color:var(--text-primary)] font-semibold mb-1 text-sm md:text-base break-all px-2">{file.name}</div>
                  <div className="text-xs md:text-sm text-[color:var(--text-muted)]">{(file.size / (1024 * 1024)).toFixed(1)}{t('ui.mb.tap.to.change')}</div>
                </>
              ) : (
                <>
                  {isMobile ? (
                    <>
                      <Upload size={36} className="mx-auto text-[#F97316]/70 mb-3" />
                      <div className="text-[color:var(--text-primary)] font-semibold mb-1">{t('ui.tap.to.select.schedule')}</div>
                      <div className="text-sm text-[color:var(--text-muted)] mb-3">{t('ui.browse.files.on.your.device')}</div>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={40} className="mx-auto text-gray-700 group-hover:text-[#F97316]/60 mb-4 transition-colors" />
                      <div className="text-[color:var(--text-primary)] font-semibold mb-1">{t('ui.drop.your.schedule.file.here')}</div>
                      <div className="text-sm text-[color:var(--text-muted)] mb-4">{t('ui.or.click.to.browse')}</div>
                    </>
                  )}
                  <div className="flex items-center justify-center gap-1.5 md:gap-2 flex-wrap">
                    {[".xlsx", ".csv", ".mpp", ".xml", ".xer"].map((ext) => (
                      <span key={ext} className="text-xs bg-[#1F1F25] text-[color:var(--text-muted)] px-2 py-1 rounded font-mono">
                        {ext}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept={isMobile ? "*/*" : ".xlsx,.xls,.csv,.mpp,.xml,.xer,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/xml,application/pdf,application/octet-stream"}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 100 * 1024 * 1024) {
                      setError(t('ui.file.too.large.maximum.file.size.is.100mb'));
                      return;
                    }
                    if (!isValidFileType(f)) {
                      setError(t('ui.unsupported.file.type.accepted.xlsx.xls.csv.mpp.xml.xer'));
                      return;
                    }
                    setFile(f);
                    setError("");
                  }
                }}
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                <p className="mb-3">{error}</p>
                <SupportButton context={`Upload error: ${error}`} variant="inline" />
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!file || !selectedProjectId}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-40 disabled:cursor-not-allowed text-[color:var(--text-primary)] rounded-xl text-sm font-semibold transition-colors"
            >
              <Upload size={16} />{t('ui.parse.schedule')}
            </button>
          </>
        )}

        {/* Uploading state */}
        {step === "uploading" && (
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-8 md:p-12 text-center">
            <Loader2 size={isMobile ? 36 : 48} className="mx-auto text-[#F97316] animate-spin mb-4" />
            <h2 className="text-lg md:text-xl font-bold text-[color:var(--text-primary)] mb-2">{t('ui.analyzing.schedule')}</h2>
            <p className="text-[color:var(--text-muted)] text-sm">
              {uploadProgress < 10 ? t('ui.preparing.upload') :
               uploadProgress < 30 ? t('ui.uploading.file') :
               uploadProgress < 50 ? t('ui.uploading') :
               uploadProgress < 90 ? t('ui.parsing.activities.and.detecting.columns') :
               t('ui.almost.done')}
            </p>
            <div className="mt-4">
              <div className="w-full bg-[#1F1F25] rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-[#F97316] h-2.5 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(uploadProgress, 5)}%` }}
                />
              </div>
              <p className="text-xs text-[color:var(--text-muted)] mt-2">{uploadProgress}%</p>
            </div>
            {isMobile && (
              <p className="text-xs text-gray-600 mt-4">{t('ui.keep.this.screen.open.while.uploading')}</p>
            )}
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && result && (
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-[#22C55E] mb-4" />
            <h2 className="text-xl font-bold text-[color:var(--text-primary)] mb-1">{t('ui.schedule.imported')}</h2>
            <p className="text-[color:var(--text-muted)] text-sm mb-6">{t('ui.your.project.intelligence.is.ready')}</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-4">
                <div className="text-2xl font-bold text-[color:var(--text-primary)]">{result.activities_parsed}</div>
                <div className="text-xs text-[color:var(--text-muted)]">{t('ui.activities.e58f7f')}</div>
              </div>
              <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-4">
                <div className="text-2xl font-bold text-[#F97316]">{result.milestones_found}</div>
                <div className="text-xs text-[color:var(--text-muted)]">{t('ui.milestones')}</div>
              </div>
            </div>

            <button
              onClick={() => router.push(`/projects/${result.project_id}`)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#F97316] hover:bg-[#ea6c0a] text-[color:var(--text-primary)] rounded-xl font-semibold transition-colors"
            >{t('ui.view.project')}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[color:var(--text-muted)]">{t('ui.loading.b04ba4')}</div>}>
      <UploadContent />
    </Suspense>
  );
}
