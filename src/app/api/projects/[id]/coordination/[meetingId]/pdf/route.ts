import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET — generate branded HTML for print-to-PDF
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { id, meetingId } = await params;
  const supabase = getServiceClient();

  // Fetch meeting with all related data
  const { data: meeting, error } = await supabase
    .from("coordination_meetings")
    .select("*")
    .eq("id", meetingId)
    .eq("project_id", id)
    .single();

  if (error || !meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

  // Fetch project name
  const { data: project } = await supabase
    .from("daily_projects")
    .select("name, project_number")
    .eq("id", id)
    .single();

  const [agendaRes, actionsRes, attendeesRes] = await Promise.all([
    supabase.from("coordination_agenda_items").select("*").eq("meeting_id", meetingId).order("sort_order"),
    supabase.from("coordination_action_items").select("*").eq("meeting_id", meetingId).order("created_at"),
    supabase.from("coordination_attendees").select("*").eq("meeting_id", meetingId).order("name"),
  ]);

  const agenda = agendaRes.data || [];
  const actions = actionsRes.data || [];
  const attendees = attendeesRes.data || [];

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "#3B82F6", discussed: "#F97316", deferred: "#EAB308", resolved: "#22C55E",
      open: "#3B82F6", in_progress: "#F97316", cancelled: "#6B7280",
    };
    return `<span style="background:${colors[status] || "#6B7280"};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">${status.replace("_", " ")}</span>`;
  };

  const priorityBadge = (priority: string) => {
    const colors: Record<string, string> = { high: "#EF4444", medium: "#EAB308", low: "#6B7280" };
    return `<span style="background:${colors[priority] || "#6B7280"};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">${priority}</span>`;
  };

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${meeting.title} — Meeting Minutes</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { border-bottom: 3px solid #F97316; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 24px; color: #0B0B0D; }
    .header .meta { color: #666; font-size: 13px; margin-top: 8px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 16px; color: #F97316; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f5f5f5; text-align: left; padding: 8px 12px; font-weight: 600; border-bottom: 2px solid #ddd; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .notes { background: #f9f9f9; padding: 16px; border-radius: 8px; white-space: pre-wrap; font-size: 13px; }
    .attendee-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .attendee { font-size: 13px; padding: 4px 0; }
    .present { color: #22C55E; }
    .absent { color: #999; }
    .footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 11px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${meeting.title}</h1>
    <div class="meta">
      ${project ? `<strong>${project.name}</strong>${project.project_number ? ` (#${project.project_number})` : ""} · ` : ""}
      ${meeting.meeting_type.replace(/_/g, " ")} · 
      ${new Date(meeting.meeting_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      ${meeting.start_time ? ` · ${meeting.start_time}${meeting.end_time ? ` – ${meeting.end_time}` : ""}` : ""}
      ${meeting.facilitator ? ` · Facilitator: ${meeting.facilitator}` : ""}
      ${meeting.location ? ` · ${meeting.location}` : ""}
    </div>
  </div>

  ${agenda.length > 0 ? `
  <div class="section">
    <h2>Agenda</h2>
    <table>
      <thead><tr><th>#</th><th>Item</th><th>Trade</th><th>Area</th><th>Status</th><th>Notes</th></tr></thead>
      <tbody>
        ${agenda.map((a: any, i: number) => `
          <tr>
            <td>${i + 1}</td>
            <td>${a.title}${a.has_conflict ? ' ⚠️' : ''}</td>
            <td>${a.trade || "—"}</td>
            <td>${a.area || "—"}</td>
            <td>${statusBadge(a.status)}</td>
            <td>${a.notes || "—"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>` : ""}

  ${actions.length > 0 ? `
  <div class="section">
    <h2>Action Items</h2>
    <table>
      <thead><tr><th>Item</th><th>Assigned To</th><th>Company</th><th>Category</th><th>Priority</th><th>Due</th><th>Status</th></tr></thead>
      <tbody>
        ${actions.map((a: any) => `
          <tr>
            <td>${a.title}</td>
            <td>${a.assigned_to || "—"}</td>
            <td>${a.assigned_company || "—"}</td>
            <td>${a.category.replace(/_/g, " ")}</td>
            <td>${priorityBadge(a.priority)}</td>
            <td>${a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}</td>
            <td>${statusBadge(a.status)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>` : ""}

  ${attendees.length > 0 ? `
  <div class="section">
    <h2>Attendees (${attendees.filter((a: any) => a.present).length}/${attendees.length} present)</h2>
    <div class="attendee-grid">
      ${attendees.map((a: any) => `
        <div class="attendee ${a.present ? 'present' : 'absent'}">
          ${a.present ? '✓' : '○'} ${a.name}${a.company ? ` (${a.company})` : ""}${a.trade ? ` — ${a.trade}` : ""}
        </div>
      `).join("")}
    </div>
  </div>` : ""}

  ${meeting.notes ? `
  <div class="section">
    <h2>Meeting Notes</h2>
    <div class="notes">${meeting.notes}</div>
  </div>` : ""}

  <div class="footer">
    Generated by IronTrack Pulse · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
