"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Loader2, FolderOpen } from "lucide-react";
import CheckInView from "@/components/sub-ops/CheckInView";

interface SubProject {
  sub_id: string;
  project_id: string;
  project_name: string;
}

export default function SubCheckInViewPage() {
  const [projects, setProjects] = useState<SubProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("project_subs")
        .select("id, project_id, daily_projects(name)")
        .eq("contact_email", user.email);

      if (data && data.length > 0) {
        const mapped = data.map((row: any) => ({
          sub_id: row.id,
          project_id: row.project_id,
          project_name: row.daily_projects?.name || "Unknown Project",
        }));
        setProjects(mapped);
        setSelectedProjectId(mapped[0].project_id);
      }
      setLoading(false);
    }
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-8 text-center">
        <FolderOpen size={36} className="mx-auto text-[color:var(--text-muted)] mb-3" />
        <p className="text-[color:var(--text-secondary)]">No projects assigned to your account yet.</p>
        <p className="text-sm text-[color:var(--text-muted)] mt-2">Contact your GC to get added to a project.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Project selector if multiple */}
      {projects.length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider">Project:</span>
          <select
            value={selectedProjectId || ""}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[#3B82F6]"
          >
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedProjectId && <CheckInView projectId={selectedProjectId} />}
    </div>
  );
}