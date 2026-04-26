import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/safety/[talkId]/pdf — generate PDF HTML
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; talkId: string }> }
) {
  const { id, talkId } = await params;
  const supabase = getServiceClient();

  // Get talk
  const { data: talk, error } = await supabase
    .from("toolbox_talks")
    .select("*")
    .eq("id", talkId)
    .eq("project_id", id)
    .single();

  if (error || !talk) {
    return NextResponse.json({ error: "Talk not found" }, { status: 404 });
  }

  // Get attendees
  const { data: attendees } = await supabase
    .from("toolbox_talk_attendees")
    .select("*")
    .eq("talk_id", talkId)
    .order("created_at", { ascending: true });

  // Get project name
  const { data: project } = await supabase
    .from("daily_projects")
    .select("name, project_number")
    .eq("id", id)
    .single();

  // Optional company/project name overrides from query params
  const url = new URL(req.url);
  const companyParam = url.searchParams.get("company");
  const projectNameParam = url.searchParams.get("projectName");

  const talkDate = new Date(talk.talk_date + "T12:00:00");
  const formattedDate = talkDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categoryLabel = talk.category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const attendeeRows = (attendees || [])
    .map(
      (a: any) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #2a2a35;">${a.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #2a2a35;">${a.trade || "—"}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #2a2a35;">${a.company || "—"}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #2a2a35; text-align: center;">
          ${a.signed ? "✓" : "—"}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #2a2a35;">
          ${a.signed_at ? new Date(a.signed_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
        </td>
      </tr>`
    )
    .join("");

  const talkingPointsHtml = (talk.talking_points || [])
    .map(
      (point: string, i: number) =>
        `<li style="margin-bottom: 8px; line-height: 1.5;">${point}</li>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Toolbox Talk — ${talk.topic}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0B0B0D; color: #e5e5e5; padding: 0; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #0B0B0D 100%); border-bottom: 3px solid #E85D1C; padding: 24px 32px; }
    .header h1 { color: #E85D1C; font-size: 20px; margin-bottom: 4px; }
    .header .subtitle { color: #999; font-size: 13px; }
    .content { padding: 24px 32px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .meta-item { background: #121217; border: 1px solid #1F1F25; border-radius: 8px; padding: 12px; }
    .meta-label { color: #777; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-value { color: #e5e5e5; font-size: 14px; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section-title { color: #E85D1C; font-size: 14px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    ol { padding-left: 20px; color: #ccc; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #1a1a2e; color: #E85D1C; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { color: #ccc; }
    .notes-box { background: #121217; border: 1px solid #1F1F25; border-radius: 8px; padding: 16px; font-size: 13px; color: #ccc; line-height: 1.5; }
    .footer { text-align: center; padding: 16px 32px; color: #555; font-size: 11px; border-top: 1px solid #1F1F25; margin-top: 24px; }
    @media print { body { background: white; color: #333; } .header { background: white; border-bottom-color: #E85D1C; } .header h1 { color: #E85D1C; } .header .subtitle { color: #666; } .meta-item { background: #f5f5f5; border-color: #ddd; } .meta-label { color: #666; } .meta-value { color: #333; } th { background: #E85D1C; color: white; } td { color: #333; border-bottom-color: #ddd !important; } .notes-box { background: #f5f5f5; border-color: #ddd; color: #333; } .footer { color: #999; border-top-color: #ddd; } ol { color: #333; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${companyParam ? `${companyParam} | ` : ""}TOOLBOX TALK</h1>
    <div class="subtitle">${projectNameParam || project?.name || "Project"} ${project?.project_number ? `— #${project.project_number}` : ""}</div>
  </div>
  <div class="content">
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Topic</div>
        <div class="meta-value">${talk.topic}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Category</div>
        <div class="meta-value">${categoryLabel}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Date</div>
        <div class="meta-value">${formattedDate}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Presenter</div>
        <div class="meta-value">${talk.presenter || "—"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Duration</div>
        <div class="meta-value">${talk.duration_minutes} minutes</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Location</div>
        <div class="meta-value">${talk.location || "—"}</div>
      </div>
    </div>

    ${(talk.talking_points || []).length > 0 ? `
    <div class="section">
      <div class="section-title">Talking Points</div>
      <ol>${talkingPointsHtml}</ol>
    </div>` : ""}

    <div class="section">
      <div class="section-title">Attendance (${(attendees || []).filter((a: any) => a.signed).length} of ${(attendees || []).length} signed)</div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Trade</th>
            <th>Company</th>
            <th style="text-align: center;">Signed</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${attendeeRows || '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #666;">No attendees recorded</td></tr>'}
        </tbody>
      </table>
    </div>

    ${talk.notes ? `
    <div class="section">
      <div class="section-title">Notes</div>
      <div class="notes-box">${talk.notes}</div>
    </div>` : ""}

    ${talk.corrective_actions ? `
    <div class="section">
      <div class="section-title">Corrective Actions</div>
      <div class="notes-box">${talk.corrective_actions}</div>
    </div>` : ""}

    ${talk.follow_up_needed ? `
    <div class="section">
      <div class="section-title">Follow-Up Required</div>
      <div class="notes-box">${talk.follow_up_notes || "Follow-up needed — details pending"}</div>
    </div>` : ""}
  </div>
  <div class="footer">
    Generated by ${companyParam || "IronTrack Pulse"} — ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
