import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/daily-logs — list logs for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "30");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const { data, error, count } = await supabase
    .from("daily_logs")
    .select("*", { count: "exact" })
    .eq("project_id", id)
    .order("log_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logs: data, total: count });
}

// POST /api/projects/[id]/daily-logs — create or upsert a daily log
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const logDate = body.log_date || new Date().toISOString().split("T")[0];

  // Upsert: if a log for this project+date exists, update it
  const { data: existing } = await supabase
    .from("daily_logs")
    .select("id, status")
    .eq("project_id", id)
    .eq("log_date", logDate)
    .single();

  if (existing) {
    // Don't allow edits to locked logs
    if (existing.status === "locked") {
      return NextResponse.json({ error: "Log is locked and cannot be edited" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("daily_logs")
      .update({
        ...body,
        project_id: id,
        log_date: logDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Create new
  const { data, error } = await supabase
    .from("daily_logs")
    .insert({
      ...body,
      project_id: id,
      log_date: logDate,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
