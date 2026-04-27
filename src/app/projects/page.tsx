"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Building2, MapPin, Calendar, ChevronRight } from "lucide-react";
import AddProjectModal from "@/components/AddProjectModal";

interface Project {
  id: string;
  name: string;
  project_number?: string;
  client_name?: string;
  location?: string;
  status: string;
  health_score: number;
  start_date?: string;
  target_finish_date?: string;
  stats: {
    totalActivities: number;
    completionPercent: number;
    highRisks: number;
    lateActivities: number;
  };
}

function healthColor(score: number) {
  if (score >= 85) return "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20";
  if (score >= 70) return "text-[#EAB308] bg-[#EAB308]/10 border-[#EAB308]/20";
  return "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20";
}

function bandLabel(score: number) {
  if (score >= 85) return "On Track";
  if (score >= 70) return "Watch";
  return "At Risk";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      <div className="sticky top-0 z-10 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F25] px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-[color:var(--text-primary)]">All Projects</h1>
            <p className="text-sm text-[color:var(--text-muted)] mt-0.5">{projects.length} active project{projects.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#F97316] hover:bg-[#ea6c0a] text-[color:var(--text-primary)] rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Add Project
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-20 text-[color:var(--text-muted)]">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={40} className="mx-auto text-gray-700 mb-3" />
            <p className="text-[color:var(--text-muted)]">No projects yet.</p>
            <button onClick={() => setShowAdd(true)} className="mt-4 px-5 py-2 bg-[#F97316] text-[color:var(--text-primary)] rounded-lg text-sm font-semibold">
              Create First Project
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center bg-[#121217] border border-[#1F1F25] rounded-xl px-5 py-4 hover:border-[#F97316]/30 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-[color:var(--text-primary)] group-hover:text-[#F97316] transition-colors">{p.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${healthColor(p.health_score)}`}>
                      {bandLabel(p.health_score)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[color:var(--text-muted)]">
                    {p.client_name && <span>{p.client_name}</span>}
                    {p.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} />
                        {p.location}
                      </span>
                    )}
                    {p.target_finish_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        Target: {new Date(p.target_finish_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-8 mr-4">
                  <div className="text-center">
                    <div className="text-sm font-bold text-[color:var(--text-primary)]">{p.stats.completionPercent}%</div>
                    <div className="text-[10px] text-gray-600">Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-[#EF4444]">{p.stats.highRisks}</div>
                    <div className="text-[10px] text-gray-600">High Risks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-[#EAB308]">{p.stats.lateActivities}</div>
                    <div className="text-[10px] text-gray-600">Overdue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-[color:var(--text-primary)]">{p.stats.totalActivities}</div>
                    <div className="text-[10px] text-gray-600">Activities</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-600 group-hover:text-[#F97316] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddProjectModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); fetch_(); }} />
      )}
    </div>
  );
}
