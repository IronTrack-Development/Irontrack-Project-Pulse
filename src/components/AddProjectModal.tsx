"use client";

import { useState } from "react";
import { X, Building2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddProjectModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Project name is required.");
    setSaving(true);
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      onCreated();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create project.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F25]">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-[#F97316]" />
            <h2 className="font-bold text-[color:var(--text-primary)]">New Project</h2>
          </div>
          <button onClick={onClose} className="text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              autoFocus
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-40 text-[color:var(--text-primary)] rounded-lg text-sm font-semibold transition-colors"
            >
              {saving ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
