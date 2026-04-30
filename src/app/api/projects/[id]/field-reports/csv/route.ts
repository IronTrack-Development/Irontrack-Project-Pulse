import { NextRequest, NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/project-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireProjectAccess(id);
  if (access.response) return access.response;
  const supabase = access.supabase;
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids");

  let query = supabase
    .from("field_reports")
    .select("*")
    .eq("project_id", id)
    .order("report_number", { ascending: true });

  if (idsParam) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    query = query.in("id", ids);
  }

  const { data: reports, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = [
    "Report #",
    "Title",
    "Status",
    "Priority",
    "Assigned To",
    "Trade",
    "Location",
    "Comments",
    "Resolution Notes",
    "Created At",
    "Photo Path",
  ];

  const rows = (reports || []).map((report) => [
    report.report_number,
    report.title,
    report.status,
    report.priority,
    report.assigned_to || "",
    report.trade || "",
    report.location || "",
    report.comments || "",
    report.resolution_notes || "",
    report.created_at || "",
    report.photo_path || "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const filename = `field-reports-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
