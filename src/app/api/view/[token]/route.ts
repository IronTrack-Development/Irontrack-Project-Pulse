import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getArizonaToday } from "@/lib/arizona-date";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/view/[token]
// PUBLIC — no auth required. Returns filtered schedule for a sub's share link.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Rate limiting: 60 requests per minute per IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(`view:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = getServiceClient();

  // 1. Validate the token
  const { data: link, error: linkError } = await supabase
    .from("sub_share_links")
    .select("id, project_id, sub_id, active, expires_at, created_at")
    .eq("token", token)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  if (!link.active) {
    return NextResponse.json({ error: "This link has been deactivated" }, { status: 410 });
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  // 2. Get project details
  const { data: project, error: projError } = await supabase
    .from("daily_projects")
    .select("id, name, location, updated_at")
    .eq("id", link.project_id)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // 3. Get the sub info (trades + manually selected activity_ids)
  const { data: sub, error: subError } = await supabase
    .from("project_subs")
    .select("id, sub_name, trades, activity_ids")
    .eq("id", link.sub_id)
    .single();

  if (subError || !sub) {
    return NextResponse.json({ error: "Sub not found" }, { status: 404 });
  }

  // 4. Query activities — use manually selected IDs if available, otherwise fall back to trade filter
  const SAFE_COLUMNS = "id, activity_id, activity_name, trade, start_date, finish_date, actual_start, actual_finish, percent_complete, status, original_duration, remaining_duration, milestone, normalized_building, normalized_area, normalized_phase, normalized_work_type, normalized_trade, wbs";

  const safeFields = (act: any) => ({
    id: act.id,
    activity_id: act.activity_id,
    activity_name: act.activity_name,
    trade: act.trade,
    start_date: act.start_date,
    finish_date: act.finish_date,
    actual_start: act.actual_start,
    actual_finish: act.actual_finish,
    percent_complete: act.percent_complete,
    status: act.status,
    original_duration: act.original_duration,
    remaining_duration: act.remaining_duration,
    milestone: act.milestone,
    normalized_building: act.normalized_building,
    normalized_area: act.normalized_area,
    normalized_phase: act.normalized_phase,
    normalized_trade: act.normalized_trade,
    wbs: act.wbs,
  });

  let subActivities;
  let actError;

  if (sub.activity_ids && sub.activity_ids.length > 0) {
    // GC hand-picked specific activities for this sub
    const result = await supabase
      .from("parsed_activities")
      .select(SAFE_COLUMNS)
      .eq("project_id", link.project_id)
      .in("id", sub.activity_ids);
    subActivities = result.data;
    actError = result.error;
  } else {
    // Fall back to trade-based filtering
    const result = await supabase
      .from("parsed_activities")
      .select(SAFE_COLUMNS)
      .eq("project_id", link.project_id)
      .in("trade", sub.trades);
    subActivities = result.data;
    actError = result.error;
  }

  if (actError) {
    return NextResponse.json({ error: actError.message }, { status: 500 });
  }

  const activities = (subActivities ?? []).map(safeFields);

  // 6. Log the view
  const viewerIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const { data: viewRecord } = await supabase
    .from("sub_schedule_views")
    .insert({
      link_id: link.id,
      viewer_ip: viewerIp,
      user_agent: userAgent,
      acknowledged: false,
    })
    .select("id")
    .single();

  // 7. Group activities by time bucket
  const todayStr = getArizonaToday();
  const now = new Date(todayStr + "T12:00:00");

  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const twoWeekEnd = new Date(now);
  twoWeekEnd.setDate(twoWeekEnd.getDate() + 14);
  const twoWeekEndStr = twoWeekEnd.toISOString().split("T")[0];

  function bucketActivity(act: (typeof activities)[0]) {
    const start = act.start_date ?? "";
    const finish = act.finish_date ?? "";
    const status = act.status ?? "";

    if (status === "complete") return "complete";
    if (finish < todayStr) return "overdue";

    // "today" = active right now (start <= today <= finish)
    if (start <= todayStr && finish >= todayStr) return "today";
    if (start <= weekEndStr) return "this_week";
    if (start <= twoWeekEndStr) return "next_two_weeks";
    return "upcoming";
  }

  const grouped: Record<string, typeof activities> = {
    today: [],
    this_week: [],
    next_two_weeks: [],
    overdue: [],
    complete: [],
    upcoming: [],
  };

  for (const act of activities) {
    const bucket = bucketActivity(act);
    grouped[bucket].push(act);
  }

  // Stats
  const totalTasks = activities.length;
  const completeTasks = grouped.complete.length;
  const overdueTasks = grouped.overdue.length;
  const thisWeekTasks = grouped.today.length + grouped.this_week.length;
  const pctComplete = totalTasks > 0 ? Math.round((completeTasks / totalTasks) * 100) : 0;

  return NextResponse.json({
    view_id: viewRecord?.id ?? null,
    project: {
      id: project.id,
      name: project.name,
      location: project.location,
      schedule_updated_at: project.updated_at,
    },
    sub: {
      id: sub.id,
      name: sub.sub_name,
      trades: sub.trades,
    },
    stats: {
      total_tasks: totalTasks,
      this_week: thisWeekTasks,
      overdue: overdueTasks,
      pct_complete: pctComplete,
    },
    activities: grouped,
    generated_at: now.toISOString(),
  });
}
