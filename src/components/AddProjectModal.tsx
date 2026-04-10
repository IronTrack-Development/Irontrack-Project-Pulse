"use client";

import { useState } from "react";
import { X, Building2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddProjectModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: "",
    project_number: "",
    client_name: "",
    location: "",
    start_date: "",
    target_finish_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Project name is required.");
    setSaving(true);
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
            <h2 className="font-bold text-white">New Project</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
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
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Project Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="The Marshall"
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Project #
              </label>
              <input
                type="text"
                value={form.project_number}
                onChange={(e) => setForm({ ...form, project_number: e.target.value })}
                placeholder="PHX-2025-001"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Client
              </label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="Client Name"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Phoenix, AZ"
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Start Date
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Target Finish
              </label>
              <input
                type="date"
                value={form.target_finish_date}
                onChange={(e) => setForm({ ...form, target_finish_date: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#1F1F25] text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {saving ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
