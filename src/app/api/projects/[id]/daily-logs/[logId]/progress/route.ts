import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// PUT /api/projects/[id]/daily-logs/[logId]/progress — bulk upsert progress entries
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const { logId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();
  const entries: Array<{
    activity_id: string;
    pct_complete_before: number;
    pct_complete_after: number;
    note?: string;
  }> = body.entries || [];

  if (!entries.length) {
    return NextResponse.json({ error: "No entries provided" }, { status: 400 });
  }

  // Delete existing progress for this log, then insert fresh
  await supabase.from("daily_log_progress").delete().eq("daily_log_id", logId);

  const rows = entries.map((e) => ({
    daily_log_id: logId,
    activity_id: e.activity_id,
    pct_complete_before: e.pct_complete_before,
    pct_complete_after: e.pct_complete_after,
    note: e.note || null,
  }));

  const { data, error } = await supabase
    .from("daily_log_progress")
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
