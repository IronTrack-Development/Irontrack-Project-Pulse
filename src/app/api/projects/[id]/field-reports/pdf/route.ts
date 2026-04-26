import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/field-reports/pdf
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids");

  // Fetch project name
  const { data: project } = await supabase
    .from("daily_projects")
    .select("name, project_number")
    .eq("id", id)
    .single();

  let query = supabase
    .from("field_reports")
    .select("*")
    .eq("project_id", id)
    .order("report_number", { ascending: true });

  if (idsParam) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    query = query.in("id", ids);
  } else {
    query = query.eq("status", "open");
  }

  const { data: reports, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const projectName = project?.name || "Project";
  const projectNumber = project?.project_number || "";
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("field-report-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const priorityColor: Record<string, string> = { high: "#EF4444", medium: "#EAB308", low: "#6B7280" };
  const statusColor: Record<string, string> = { open: "#F97316", in_progress: "#3B82F6", resolved: "#22C55E" };

  const rows = (reports || [])
    .map(
      (r) => `
    <tr>
      <td style="padding:8px;border:1px solid #333;vertical-align:top;width:100px;">
        ${r.photo_path ? `<img src="${getPublicUrl(r.photo_path)}" style="width:90px;height:90px;object-fit:cover;border-radius:6px;" />` : '<div style="width:90px;height:90px;background:#1F1F25;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#666;">No Photo</div>'}
      </td>
      <td style="padding:8px;border:1px solid #333;vertical-align:top;">
        <strong>#${r.report_number} — ${escapeHtml(r.title)}</strong><br/>
        ${r.assigned_to ? `<span style="color:#9CA3AF;">Assigned: ${escapeHtml(r.assigned_to)}</span><br/>` : ""}
        ${r.comments ? `<span style="color:#9CA3AF;">${escapeHtml(r.comments)}</span><br/>` : ""}
      </td>
      <td style="padding:8px;border:1px solid #333;vertical-align:top;text-align:center;">
        <span style="background:${statusColor[r.status] || "#666"};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">${r.status}</span>
      </td>
      <td style="padding:8px;border:1px solid #333;vertical-align:top;text-align:center;">
        <span style="background:${priorityColor[r.priority] || "#666"};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">${r.priority}</span>
      </td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Field Reports — ${escapeHtml(projectName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0B0B0D; color: #E5E7EB; margin: 0; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #F97316; padding-bottom: 12px; }
    .header h1 { font-size: 20px; color: #F97316; margin: 0; }
    .header .meta { font-size: 12px; color: #9CA3AF; text-align: right; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1F1F25; color: #F97316; padding: 8px; border: 1px solid #333; text-align: left; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>IronTrack — Field Reports</h1>
    <div class="meta">
      ${escapeHtml(projectName)}${projectNumber ? ` (${escapeHtml(projectNumber)})` : ""}<br/>
      ${now} · ${(reports || []).length} reports
    </div>
  </div>
  <table>
    <thead><tr><th>Photo</th><th>Details</th><th>Status</th><th>Priority</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" style="padding:16px;text-align:center;color:#666;">No reports</td></tr>'}</tbody>
  </table>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
