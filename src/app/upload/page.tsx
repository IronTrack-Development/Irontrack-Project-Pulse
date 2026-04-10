"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Upload, FileSpreadsheet, CheckCircle, AlertTriangle,
  ArrowRight, X, Plus, Loader2
} from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { ColumnMapping } from "@/types";

interface Project { id: string; name: string; }

const MAPPING_FIELDS: { key: keyof ColumnMapping; label: string; required?: boolean }[] = [
  { key: "activity_name", label: "Activity Name", required: true },
  { key: "activity_id", label: "Activity ID" },
  { key: "start_date", label: "Start Date" },
  { key: "finish_date", label: "Finish Date" },
  { key: "original_duration", label: "Duration (days)" },
  { key: "percent_complete", label: "% Complete" },
  { key: "actual_start", label: "Actual Start" },
  { key: "actual_finish", label: "Actual Finish" },
  { key: "predecessor_ids", label: "Predecessors" },
  { key: "wbs", label: "WBS Code" },
  { key: "area", label: "Area / Zone" },
  { key: "trade", label: "Trade (optional override)" },
  { key: "milestone", label: "Milestone Flag" },
];

function UploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedProjectId = searchParams.get("project") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [step, setStep] = useState<"select" | "map" | "done">("select");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    activities_parsed: number;
    milestones_found: number;
    risks_detected: number;
    health_score: number;
    project_id: string;
  } | null>(null);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects);
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const processFile = async (f: File) => {
    setFile(f);
    setError("");
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

    setDetectedColumns(columns);

    // Auto-map common column names
    const autoMap: ColumnMapping = {};
    const tryMap = (field: keyof ColumnMapping, patterns: string[]) => {
      for (const col of columns) {
        const lower = col.toLowerCase().replace(/[\s_-]/g, "");
        for (const p of patterns) {
          if (lower.includes(p)) { autoMap[field] = col; return; }
        }
      }
    };
    tryMap("activity_name", ["activityname", "taskname", "description", "name"]);
    tryMap("activity_id", ["activityid", "taskid", "id", "code"]);
    tryMap("start_date", ["startdate", "start", "earlystart", "baselinestart"]);
    tryMap("finish_date", ["finishdate", "finish", "earlyfinish", "baselinefinish", "end"]);
    tryMap("original_duration", ["duration", "originalduration", "planedduration"]);
    tryMap("percent_complete", ["percentcomplete", "percentdone", "complete", "pct"]);
    tryMap("actual_start", ["actualstart", "actstart"]);
    tryMap("actual_finish", ["actualfinish", "actfinish"]);
    tryMap("predecessor_ids", ["predecessor", "predecessors", "pred"]);
    tryMap("wbs", ["wbs", "workbreakdown"]);
    tryMap("area", ["area", "zone", "location", "level"]);
    tryMap("milestone", ["milestone", "ismilestone", "flag"]);
    setMapping(autoMap);
    setStep("map");
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
    if (!file || !selectedProjectId) return setError("Select a project and file.");
    if (!mapping.activity_name) return setError("Activity Name column mapping is required.");
    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("project_id", selectedProjectId);
    fd.append("mapping", JSON.stringify(mapping));

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error || "Upload failed.");
      return;
    }
    setResult(data);
    setStep("done");
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      <div className="sticky top-0 z-10 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F25] px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-white">Upload Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">Import .xlsx, .xls, .csv, .pdf, or .mpp schedule files</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Step 1: Select project + file */}
        {step === "select" && (
          <>
            {/* Project selector */}
            <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">1. Select Project</h2>
              {showNewProject ? (
                <div className="flex gap-2">
                  <input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="New project name"
                    className="flex-1 bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F97316]/50"
                    onKeyDown={(e) => e.key === "Enter" && createProject()}
                  />
                  <button onClick={createProject} className="px-4 py-2 bg-[#F97316] text-white rounded-lg text-sm font-semibold">
                    Create
                  </button>
                  <button onClick={() => setShowNewProject(false)} className="px-3 py-2 bg-[#1F1F25] text-gray-400 rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="flex-1 bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316]/50"
                  >
                    <option value="">— Select a project —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1F1F25] text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
                  >
                    <Plus size={14} />
                    New
                  </button>
                </div>
              )}
            </div>

            {/* File drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#1F1F25] hover:border-[#F97316]/40 rounded-2xl p-12 text-center cursor-pointer transition-colors group"
            >
              <FileSpreadsheet size={40} className="mx-auto text-gray-700 group-hover:text-[#F97316]/60 mb-4 transition-colors" />
              <div className="text-white font-semibold mb-1">Drop your schedule file here</div>
              <div className="text-sm text-gray-500 mb-4">or click to browse</div>
              <div className="flex items-center justify-center gap-2">
                {[".xlsx", ".xls", ".csv", ".pdf", ".mpp"].map((ext) => (
                  <span key={ext} className="text-xs bg-[#1F1F25] text-gray-500 px-2 py-1 rounded font-mono">
                    {ext}
                  </span>
                ))}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,.mpp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
            </div>
          </>
        )}

        {/* Step 2: Column mapping */}
        {step === "map" && file && (
          <>
            {/* File info */}
            <div className="flex items-center gap-3 bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-3">
              <FileSpreadsheet size={18} className="text-[#22C55E]" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{file.name}</div>
                <div className="text-xs text-gray-500">{detectedColumns.length} columns detected</div>
              </div>
              <button onClick={() => { setFile(null); setStep("select"); setMapping({}); }} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Project */}
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-3">
              <div className="text-xs text-gray-500 mb-1">Project</div>
              <div className="text-sm font-medium text-white">
                {projects.find((p) => p.id === selectedProjectId)?.name || selectedProjectId}
              </div>
            </div>

            {/* Mapping wizard */}
            <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-1">2. Map Columns</h2>
              <p className="text-xs text-gray-500 mb-5">
                Tell IronTrack which column in your file maps to each field.
              </p>
              <div className="space-y-3">
                {MAPPING_FIELDS.map(({ key, label, required }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-44 text-sm text-gray-400 shrink-0">
                      {label}
                      {required && <span className="text-[#EF4444] ml-1">*</span>}
                    </div>
                    <select
                      value={mapping[key] || ""}
                      onChange={(e) => setMapping({ ...mapping, [key]: e.target.value || undefined })}
                      className="flex-1 bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#F97316]/50"
                    >
                      <option value="">— Not mapped —</option>
                      {detectedColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep("select"); setFile(null); }}
                className="px-5 py-2.5 border border-[#1F1F25] text-gray-400 rounded-lg text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedProjectId || !mapping.activity_name}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Parsing Schedule...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Parse Schedule
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Step 3: Done */}
        {step === "done" && result && (
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-[#22C55E] mb-4" />
            <h2 className="text-xl font-bold text-white mb-1">Schedule Imported!</h2>
            <p className="text-gray-500 text-sm mb-6">Your project intelligence is ready.</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{result.activities_parsed}</div>
                <div className="text-xs text-gray-500">Activities</div>
              </div>
              <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-4">
                <div className="text-2xl font-bold text-[#F97316]">{result.milestones_found}</div>
                <div className="text-xs text-gray-500">Milestones</div>
              </div>
              <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-4">
                <div className="text-2xl font-bold text-[#EF4444]">{result.risks_detected}</div>
                <div className="text-xs text-gray-500">Risks Found</div>
              </div>
            </div>

            {result.risks_detected > 0 && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-4 py-3 mb-6 text-sm text-left">
                <AlertTriangle size={14} className="text-[#EF4444] inline mr-2" />
                <span className="text-[#EF4444] font-semibold">{result.risks_detected} risks detected</span>
                <span className="text-gray-400"> — review the Risks tab before your next site visit.</span>
              </div>
            )}

            <button
              onClick={() => router.push(`/projects/${result.project_id}`)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#F97316] hover:bg-[#ea6c0a] text-white rounded-xl font-semibold transition-colors"
            >
              View Project
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
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <UploadContent />
    </Suspense>
  );
}
