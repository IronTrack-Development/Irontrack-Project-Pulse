"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText, Plus, X, ChevronDown, ChevronUp, Upload, Download,
  CheckCircle, Clock, Users, Trash2, Send,
} from "lucide-react";

interface Props {
  projectId: string;
}

interface SOP {
  id: string;
  title: string;
  category: string;
  description: string | null;
  version: string;
  file_url: string | null;
  file_name: string | null;
  acknowledged_count: number;
  total_foremen: number;
  created_at: string;
}

interface SOPDetail extends SOP {
  acknowledgments: { foreman_id: string; foreman_name: string; acknowledged_at: string | null }[];
}

const CATEGORIES = [
  "general", "safety", "quality", "environmental", "emergency",
  "equipment", "material_handling", "site_access", "other",
];

const CATEGORY_STYLES: Record<string, string> = {
  general: "bg-gray-700 text-gray-300",
  safety: "bg-red-500/20 text-red-300",
  quality: "bg-blue-500/20 text-blue-300",
  environmental: "bg-green-500/20 text-green-300",
  emergency: "bg-orange-500/20 text-orange-300",
  equipment: "bg-yellow-500/20 text-yellow-300",
  material_handling: "bg-purple-500/20 text-purple-300",
  site_access: "bg-indigo-500/20 text-indigo-300",
  other: "bg-gray-700 text-gray-300",
};

export default function SOPLibrary({ projectId }: Props) {
  const [sops, setSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedSop, setSelectedSop] = useState<SOPDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Upload form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const companyId = typeof window !== "undefined" ? localStorage.getItem("sub_ops_company_id") : null;

  const fetchSops = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/sops`);
      if (res.ok) {
        const d = await res.json();
        setSops(Array.isArray(d) ? d : d.sops ?? []);
      }
    } catch {}
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchSops(); }, [fetchSops]);

  const fetchDetail = async (id: string) => {
    if (!companyId) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/sops/${id}`);
      if (res.ok) setSelectedSop(await res.json());
    } catch {}
    setDetailLoading(false);
  };

  const handleUpload = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("category", category);
      formData.append("description", description.trim());
      if (file) formData.append("file", file);

      const res = await fetch(`/api/sub-ops/companies/${companyId}/sops`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setFile(null);
        setShowUpload(false);
        await fetchSops();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to upload SOP");
      }
    } catch {
      setError("Network error");
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this SOP?")) return;
    try {
      await fetch(`/api/sub-ops/companies/${companyId}/sops/${id}`, { method: "DELETE" });
      setSelectedSop(null);
      await fetchSops();
    } catch {}
  };

  const handleAssignAll = async (id: string) => {
    try {
      await fetch(`/api/sub-ops/companies/${companyId}/sops/${id}/assign-all`, { method: "POST" });
      await fetchDetail(id);
    } catch {}
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  // Group SOPs by category
  const grouped = sops.reduce<Record<string, SOP[]>>((acc, s) => {
    const cat = s.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── SOP Detail View ──
  if (selectedSop) {
    const s = selectedSop;
    const catCls = CATEGORY_STYLES[s.category] ?? CATEGORY_STYLES.other;

    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedSop(null)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors min-h-[44px]"
        >
          <X size={14} /> Back to Library
        </button>

        {detailLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-white">{s.title}</h2>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${catCls}`}>
                      {s.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Version {s.version}</p>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs transition-colors min-h-[36px]"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>

              {s.description && <p className="text-sm text-gray-300">{s.description}</p>}

              {s.file_url && (
                <a
                  href={s.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-lg text-sm text-gray-300 hover:text-white transition-colors min-h-[44px] inline-flex"
                >
                  <Download size={14} /> {s.file_name || "Download File"}
                </a>
              )}
            </div>

            {/* Acknowledgments */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users size={14} className="text-[#F97316]" />
                  Acknowledgments ({s.acknowledged_count}/{s.total_foremen})
                </h3>
                <button
                  onClick={() => handleAssignAll(s.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/20 rounded-lg text-xs font-medium transition-colors min-h-[36px]"
                >
                  <Send size={12} /> Assign to All
                </button>
              </div>

              {(s.acknowledgments?.length ?? 0) === 0 ? (
                <p className="text-xs text-gray-600">No foremen assigned yet</p>
              ) : (
                <div className="space-y-1">
                  {s.acknowledgments.map((a) => (
                    <div key={a.foreman_id} className="flex items-center justify-between py-1.5 text-xs">
                      <span className="text-gray-300">{a.foreman_name}</span>
                      {a.acknowledged_at ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle size={10} /> {new Date(a.acknowledged_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-400">
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Library List View ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">SOP Library</h2>
          <p className="text-xs text-gray-500 mt-0.5">{sops.length} documents</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] hover:bg-[#ea6c0a] text-white rounded-lg text-xs font-semibold transition-colors min-h-[44px]"
        >
          {showUpload ? <><X size={14} /> Cancel</> : <><Upload size={14} /> Upload SOP</>}
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white">New SOP</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fall Protection Procedures"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316]/50 appearance-none min-h-[44px]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this SOP..."
              rows={2}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">File (PDF/DOC)</label>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-gray-400 hover:text-white hover:border-[#F97316]/30 transition-colors w-full min-h-[44px]"
            >
              <Upload size={14} />
              {file ? file.name : "Choose file..."}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors min-h-[44px]"
          >
            <Upload size={14} />
            {uploading ? "Uploading..." : "Upload SOP"}
          </button>
        </div>
      )}

      {/* Grouped SOP List */}
      {sops.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-8 text-center">
          <FileText size={28} className="mx-auto text-gray-600 mb-2" />
          <p className="text-sm text-gray-400">No SOPs uploaded yet</p>
          <p className="text-xs text-gray-600 mt-1">Upload standard operating procedures for your foremen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => {
            const isCollapsed = collapsedCategories.has(cat);
            const catCls = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.other;

            return (
              <div key={cat} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a20] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${catCls}`}>
                      {cat.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-400">{items.length} document{items.length !== 1 ? "s" : ""}</span>
                  </div>
                  {isCollapsed ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronUp size={14} className="text-gray-500" />}
                </button>

                {!isCollapsed && (
                  <div className="border-t border-[var(--border-primary)] divide-y divide-[var(--border-primary)]">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => fetchDetail(s.id)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-[#1a1a20] transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText size={12} className="text-[#F97316] flex-none" />
                            <span className="text-sm text-white truncate">{s.title}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5 ml-5">v{s.version}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            s.acknowledged_count === s.total_foremen && s.total_foremen > 0
                              ? "bg-green-500/20 text-green-300"
                              : "bg-orange-500/20 text-orange-300"
                          }`}>
                            {s.acknowledged_count}/{s.total_foremen} acknowledged
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
