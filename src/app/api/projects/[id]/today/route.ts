import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { resolveClientDate } from "@/lib/arizona-date";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { searchParams } = new URL(_req.url);
  const clientDate = searchParams.get("clientDate"); // YYYY-MM-DD from client's timezone

  const todayStr = resolveClientDate(clientDate);
  const today = new Date(todayStr + "T12:00:00");
  today.setHours(0, 0, 0, 0);

  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split("T")[0];

  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const threeDaysFromNowStr = threeDaysFromNow.toISOString().split("T")[0];

  const [
    { data: happeningToday },
    { data: recentStarts },
    { data: finishingSoon },
    { data: atRisk },
    { data: risks },
  ] = await Promise.all([
    supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", id)
      .lte("start_date", todayStr)
      .gte("finish_date", todayStr)
      .neq("status", "complete")
      .order("trade"),
    supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", id)
      .gte("actual_start", threeDaysAgoStr)
      .lte("actual_start", todayStr)
      .order("actual_start", { ascending: false }),
    supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", id)
      .gte("finish_date", todayStr)
      .lte("finish_date", threeDaysFromNowStr)
      .neq("status", "complete")
      .order("finish_date"),
    supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", id)
      .eq("status", "late"),
    supabase
      .from("daily_risks")
      .select("*")
      .eq("project_id", id)
      .eq("status", "open")
      .in("severity", ["high", "medium"])
      .order("severity"),
  ]);

  return NextResponse.json({
    date: todayStr,
    happeningToday: happeningToday || [],
    recentStarts: recentStarts || [],
    finishingSoon: finishingSoon || [],
    atRisk: atRisk || [],
    actionItems: (risks || []).map((r) => r.suggested_action).filter(Boolean),
    risks: risks || [],
  });
}
