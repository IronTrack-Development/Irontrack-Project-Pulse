"use client";

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { Plus, RefreshCw, FileImage, Calendar, Layers, Upload, Trash2, X } from "lucide-react";
import SheetBrowser from "@/components/drawings/SheetBrowser";

// Lazy-load SheetViewer to avoid SSR issues with react-pdf
const SheetViewer = lazy(() => import("@/components/drawings/SheetViewer"));

interface DrawingSet {
  id: string;
  name: string;
  revision: string;
  description?: string;
  uploaded_at: string;
  uploaded_by?: string;
  is_current: boolean;
  sheet_count: number;
}

interface DrawingSheet {
  id: string;
  sheet_number: string;
  sheet_title?: string;
  discipline?: string;
  storage_path: string;
  page_index: number;
}

interface DrawingsTabProps {
  projectId: string;
}

interface UploadForm {
  name: string;
  revision: string;
  description: string;
  mode: "new_revision" | "replace";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DrawingsTab({ projectId }: DrawingsTabProps) {
  const [drawingSets, setDrawingSets] = useState<DrawingSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Sheet browser state
  const [selectedSet, setSelectedSet] = useState<DrawingSet | null>(null);
  const [selectedSetSheets, setSelectedSetSheets] = useState<DrawingSheet[]>([]);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [openOrganizerOnMount, setOpenOrganizerOnMount] = useState(false);

  // Viewer state
  const [viewerSheetIndex, setViewerSheetIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);

  const [uploadForm, setUploadForm] = useState<UploadForm>({
    name: "",
    revision: "Rev 0",
    description: "",
    mode: "new_revision",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  const fetchSets = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/projects/${projectId}/drawings`);
      if (resp.ok) {
        const data = await resp.json();
        setDrawingSets(data.drawing_sets || []);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  const loadSheets = async (setId: string) => {
    setSheetsLoading(true);
    try {
      const resp = await fetch(
        `/api/projects/${projectId}/drawings/${setId}/sheets`
      );
      if (resp.ok) {
        const data = await resp.json();
        setSelectedSetSheets(data.sheets || []);
      }
    } finally {
      setSheetsLoading(false);
    }
  };

  const handleSetSelect = async (set: DrawingSet) => {
    setSelectedSet(set);
    await loadSheets(set.id);
  };

  const handleSheetSelect = (idx: number) => {
    setViewerSheetIndex(idx);
    setShowViewer(true);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadForm.name.trim()) return;
    setUploading(true);
    setUploadProgress("Uploading PDF to storage...");

    try {
      // Step 1: Get a signed upload URL from the server (uses service key)
      const urlRes = await fetch(`/api/projects/${projectId}/drawings/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: uploadForm.name }),
      });
      if (!urlRes.ok) {
        alert("Failed to get upload URL");
        return;
      }
      const { signed_url, token, storage_path: storagePath } = await urlRes.json();

      // Step 2: Upload directly to Supabase Storage via signed URL (no size limit)
      const uploadRes = await fetch(signed_url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf",
        },
        body: uploadFile,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => "Unknown error");
        alert(`Storage upload failed: ${errText}`);
        return;
      }

      setUploadProgress("Counting pages...");

      // Get accurate page count using pdfjs-dist (same lib react-pdf uses)
      let pageCount = 1;
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const arrayBuffer = await uploadFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pageCount = pdf.numPages;
        pdf.destroy();
      } catch (e) {
        console.warn("pdfjs page count failed, trying regex fallback:", e);
        try {
          const arrayBuffer = await uploadFile.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          const text = new TextDecoder('latin1').decode(bytes);
          const matches = text.match(/\/Type\s*\/Page[^s]/g);
          if (matches && matches.length > 0) {
            pageCount = matches.length;
          }
        } catch {
          pageCount = 1;
        }
      }

      setUploadProgress("Creating drawing set...");

      // Step 3: POST metadata to API (no file — just metadata + storage path)
      const resp = await fetch(`/api/projects/${projectId}/drawings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadForm.name,
          revision: uploadForm.revision,
          description: uploadForm.description,
          mode: uploadForm.mode,
          storage_path: storagePath,
          page_count: pageCount,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        alert(`Failed to create drawing set: ${err.error}`);
        return;
      }

      const data = await resp.json();

      setUploadProgress(`Done — organize your sheets`);
      setShowUpload(false);
      setUploadFile(null);
      setUploadForm({ name: "", revision: "Rev 0", description: "", mode: "new_revision" });
      await fetchSets();

      // Immediately open the sheet browser with organizer for the new set
      setOpenOrganizerOnMount(true);
      await handleSetSelect(data.drawing_set);
    } catch (e) {
      alert(`Upload failed — ${e instanceof Error ? e.message : 'please try again'}`);
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleDeleteSet = async (setId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this drawing set? This cannot be undone.")) return;
    const resp = await fetch(`/api/projects/${projectId}/drawings/${setId}`, {
      method: "DELETE",
    });
    if (resp.ok) {
      setDrawingSets((prev) => prev.filter((s) => s.id !== setId));
      if (selectedSet?.id === setId) setSelectedSet(null);
    }
  };

  const getPdfUrl = (storagePath: string) =>
    `${supabaseUrl}/storage/v1/object/public/drawings/${storagePath}`;

  const currentRevision = selectedSet
    ? drawingSets.find((s) => s.name === selectedSet.name && s.is_current)?.revision
    : undefined;

  // Sheet browser view
  if (selectedSet && !showViewer) {
    return (
      <>
        {sheetsLoading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw size={20} className="text-[#F97316] animate-spin" />
          </div>
        ) : (
          <SheetBrowser
            projectId={projectId}
            sheets={selectedSetSheets}
            drawingSet={selectedSet}
            onSheetSelect={handleSheetSelect}
            onBack={() => { setSelectedSet(null); setSelectedSetSheets([]); setOpenOrganizerOnMount(false); }}
            onSheetsRefresh={() => selectedSet && loadSheets(selectedSet.id)}
            openOrganizerOnMount={openOrganizerOnMount}
          />
        )}
      </>
    );
  }

  // Sheet viewer
  if (showViewer && selectedSet && selectedSetSheets.length > 0) {
    const storagePath = selectedSetSheets[0].storage_path;
    return (
      <Suspense fallback={
        <div className="fixed inset-0 z-50 bg-[#0B0B0D] flex items-center justify-center">
          <RefreshCw size={24} className="text-[#F97316] animate-spin" />
        </div>
      }>
        <SheetViewer
          projectId={projectId}
          sheets={selectedSetSheets}
          initialSheetIndex={viewerSheetIndex}
          drawingSet={selectedSet}
          currentRevision={currentRevision}
          pdfPublicUrl={getPdfUrl(storagePath)}
          onClose={() => setShowViewer(false)}
          onViewCurrentRevision={() => {
            const current = drawingSets.find(
              (s) => s.name === selectedSet.name && s.is_current
            );
            if (current) {
              setShowViewer(false);
              handleSetSelect(current);
            }
          }}
        />
      </Suspense>
    );
  }

  // Drawing sets list
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[color:var(--text-primary)] font-semibold text-base">Drawings</h2>
          <p className="text-[color:var(--text-muted)] text-xs mt-0.5">
            {drawingSets.length} set{drawingSets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSets}
            className="p-2.5 rounded-lg bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-sm font-semibold min-h-[44px] transition-colors"
          >
            <Plus size={16} />
            Upload Set
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw size={20} className="text-[#F97316] animate-spin" />
        </div>
      ) : drawingSets.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1F1F25] flex items-center justify-center mb-4">
            <Layers size={28} className="text-gray-600" />
          </div>
          <h3 className="text-[color:var(--text-primary)] font-medium mb-1">No drawings uploaded</h3>
          <p className="text-[color:var(--text-muted)] text-sm mb-6">
            Tap + to upload your first drawing set
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#F97316] text-[color:var(--text-primary)] rounded-xl font-semibold text-sm min-h-[44px]"
          >
            <Upload size={16} />
            Upload Drawing Set
          </button>
        </div>
      ) : (
        // Drawing set cards
        <div className="space-y-3">
          {drawingSets.map((set) => (
            <button
              key={set.id}
              onClick={() => handleSetSelect(set)}
              className="w-full bg-[#121217] border border-[#1F1F25] hover:border-[#F97316]/40 rounded-xl p-4 text-left transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#1F1F25] flex items-center justify-center shrink-0">
                    <FileImage size={18} className="text-[#F97316]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[color:var(--text-primary)] font-medium text-sm truncate">{set.name}</h3>
                      <span className="text-[color:var(--text-muted)] text-xs px-2 py-0.5 bg-[#1F1F25] rounded">
                        {set.revision}
                      </span>
                      {set.is_current && (
                        <span className="px-2 py-0.5 bg-green-500/15 text-green-400 rounded text-xs font-medium border border-green-500/20">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[color:var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <FileImage size={11} />
                        {set.sheet_count} sheets
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(set.uploaded_at)}
                      </span>
                    </div>
                    {set.description && (
                      <p className="text-[color:var(--text-muted)] text-xs mt-1 truncate">{set.description}</p>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => handleDeleteSet(set.id, e)}
                  className="p-2 text-gray-700 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#121217] rounded-t-2xl sm:rounded-2xl border border-[#1F1F25] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#1F1F25]">
              <h2 className="text-[color:var(--text-primary)] font-semibold">Upload Drawing Set</h2>
              <button
                onClick={() => { setShowUpload(false); setUploadFile(null); }}
                className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* File picker */}
              <div>
                <label className="text-xs text-[color:var(--text-secondary)] uppercase tracking-wider mb-2 block">
                  PDF File
                </label>
                {uploadFile ? (
                  <div className="flex items-center gap-2 p-3 bg-[#0B0B0D] border border-[#1F1F25] rounded-lg">
                    <FileImage size={16} className="text-[#F97316] shrink-0" />
                    <span className="text-[color:var(--text-primary)] text-sm flex-1 truncate">{uploadFile.name}</span>
                    <button
                      onClick={() => setUploadFile(null)}
                      className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 p-6 bg-[#0B0B0D] border-2 border-dashed border-[#1F1F25] hover:border-[#F97316]/50 rounded-lg text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-h-[80px]"
                  >
                    <Upload size={20} />
                    <span className="text-sm">Tap to select PDF</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFile(f);
                      if (!uploadForm.name) {
                        setUploadForm((prev) => ({
                          ...prev,
                          name: f.name.replace(/\.pdf$/i, ""),
                        }));
                      }
                    }
                  }}
                />
              </div>

              {/* Name */}
              <div>
                <label className="text-xs text-[color:var(--text-secondary)] uppercase tracking-wider mb-1 block">
                  Set Name *
                </label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Architectural Drawings"
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] placeholder-gray-600 text-sm min-h-[44px]"
                />
              </div>

              {/* Revision */}
              <div>
                <label className="text-xs text-[color:var(--text-secondary)] uppercase tracking-wider mb-1 block">
                  Revision
                </label>
                <input
                  type="text"
                  value={uploadForm.revision}
                  onChange={(e) => setUploadForm((p) => ({ ...p, revision: e.target.value }))}
                  placeholder="Rev 0"
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] placeholder-gray-600 text-sm min-h-[44px]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-[color:var(--text-secondary)] uppercase tracking-wider mb-1 block">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description"
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] placeholder-gray-600 text-sm min-h-[44px]"
                />
              </div>

              {/* Mode — only relevant if name matches existing */}
              {drawingSets.some((s) => s.name === uploadForm.name) && (
                <div>
                  <label className="text-xs text-[color:var(--text-secondary)] uppercase tracking-wider mb-2 block">
                    Existing Set Found — Upload as...
                  </label>
                  <div className="flex gap-2">
                    {(["new_revision", "replace"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setUploadForm((p) => ({ ...p, mode }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors min-h-[44px] ${
                          uploadForm.mode === mode
                            ? "border-[#F97316] bg-[#F97316]/10 text-[#F97316]"
                            : "border-[#1F1F25] text-[color:var(--text-secondary)]"
                        }`}
                      >
                        {mode === "new_revision" ? "New Revision" : "Replace"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {uploadProgress && (
                <p className="text-[#F97316] text-sm text-center">{uploadProgress}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-[#1F1F25] flex gap-3">
              <button
                onClick={() => { setShowUpload(false); setUploadFile(null); }}
                className="flex-1 px-4 py-3 bg-[#1F1F25] text-[color:var(--text-secondary)] rounded-xl font-medium text-sm min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadForm.name.trim() || uploading}
                className="flex-1 px-4 py-3 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-50 text-[color:var(--text-primary)] rounded-xl font-semibold text-sm min-h-[44px] transition-colors"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
