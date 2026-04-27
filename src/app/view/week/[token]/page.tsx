import { getServiceClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";

interface PageProps {
  params: Promise<{ token: string }>;
}

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtRange(start: string, end: string) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function statusColor(pct: number, status: string) {
  if (status === "complete" || pct >= 100) return "#22C55E";
  if (status === "late") return "#EF4444";
  if (pct > 0) return "#3B82F6";
  return "var(--text-muted)";
}

export default async function PublicWeekView({ params }: PageProps) {
  const { token } = await params;
  const supabase = getServiceClient();

  // Look up the share link
  const { data: link, error: linkErr } = await supabase
    .from("week_share_links")
    .select("*")
    .eq("token", token)
    .eq("active", true)
    .single();

  if (linkErr || !link) return notFound();

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[color:var(--text-secondary)] text-lg font-semibold">{t('ui.this.link.has.expired')}</p>
          <p className="text-gray-600 text-sm mt-2">{t('ui.ask.your.superintendent.for.a.new.qr.code')}</p>
        </div>
      </div>
    );
  }

  // Fetch project
  const { data: project } = await supabase
    .from("daily_projects")
    .select("id, name, location, client_name")
    .eq("id", link.project_id)
    .single();

  if (!project) return notFound();

  // Fetch week activities
  const weekNumber = link.week_number || 1;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + (weekNumber - 1) * 7 - now.getDay() + 1); // Monday of target week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startStr = weekStart.toISOString().split("T")[0];
  const endStr = weekEnd.toISOString().split("T")[0];

  const { data: activities } = await supabase
    .from("parsed_activities")
    .select("*")
    .eq("project_id", link.project_id)
    .or(`and(start_date.lte.${endStr},finish_date.gte.${startStr})`)
    .order("start_date", { ascending: true });

  const tasks = activities || [];

  // Group by day
  const dayGroups: Record<string, typeof tasks> = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = d.toISOString().split("T")[0];
    dayGroups[key] = [];
  }

  for (const task of tasks) {
    const start = task.start_date || "";
    // Add task to each day it spans within this week
    for (const dayKey of Object.keys(dayGroups)) {
      if (start <= dayKey && (task.finish_date || "9999") >= dayKey) {
        dayGroups[dayKey].push(task);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#F97316]" />
            <span className="text-xs text-[#F97316] font-bold uppercase tracking-wider">{t('ui.irontrack.project.pulse')}</span>
          </div>
          <h1 className="text-[color:var(--text-primary)] font-bold text-xl">{project.name}</h1>
          {(project.client_name || project.location) && (
            <p className="text-[color:var(--text-muted)] text-sm mt-0.5">
              {[project.client_name, project.location].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs bg-[#F97316]/15 text-[#F97316] px-3 py-1 rounded-full font-bold">{t('ui.week')} {weekNumber}{t('ui.lookahead')}
            </span>
            <span className="text-xs text-[color:var(--text-muted)]">
              {fmtRange(startStr, endStr)}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            {tasks.length}{t('ui.activit')}{tasks.length !== 1 ? t('ui.ies') : t('ui.y')}{t('ui.scheduled')}
          </div>
        </div>
      </div>

      {/* Activities by day */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {Object.entries(dayGroups).map(([dayKey, dayTasks]) => {
          const dayDate = new Date(dayKey + "T00:00:00");
          const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

          if (dayTasks.length === 0 && isWeekend) return null;

          return (
            <div key={dayKey} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
              <div className="bg-[var(--bg-primary)] border-b border-[var(--border-primary)] px-4 py-2.5">
                <div className="text-[10px] text-gray-600 uppercase tracking-wide">
                  {dayNames[dayDate.getDay()]}
                </div>
                <div className="text-sm font-semibold text-[color:var(--text-primary)]">
                  {dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
              {dayTasks.length === 0 ? (
                <div className="px-4 py-3 text-xs text-gray-600">{t('ui.no.activities')}</div>
              ) : (
                <div className="divide-y divide-[#1F1F25]">
                  {dayTasks.map((task: any) => (
                    <div key={`${dayKey}-${task.id}`} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[color:var(--text-primary)] font-medium leading-tight">
                            {task.activity_name}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            {task.trade && (
                              <span className="text-[10px] text-[#F97316] font-medium">{task.trade}</span>
                            )}
                            <span className="text-[10px] text-[color:var(--text-muted)]">
                              {fmt(task.start_date)} → {fmt(task.finish_date)}
                            </span>
                            {task.normalized_building && (
                              <span className="text-[10px] text-gray-600">
                                {task.normalized_building.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className="text-sm font-bold"
                            style={{ color: statusColor(task.percent_complete || 0, task.status) }}
                          >
                            {task.percent_complete || 0}%
                          </div>
                          <div className="w-12 h-1 bg-[var(--bg-tertiary)] rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${task.percent_complete || 0}%`,
                                backgroundColor: statusColor(task.percent_complete || 0, task.status),
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto px-4 pb-8 text-center">
        <div className="h-px bg-gradient-to-r from-transparent via-[#F97316]/30 to-transparent mb-4" />
        <p className="text-[10px] text-gray-600">{t('ui.powered.by.irontrack.project.pulse.generated')} {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
