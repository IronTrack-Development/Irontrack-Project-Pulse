import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/lookahead-6week
// Returns activities in the 4-6 week window, organized by category:
// milestones, long-lead/procurement, mobilizations, inspections
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  // Calculate the 4-6 week window
  const now = new Date();
  const week4Start = new Date(now);
  week4Start.setDate(now.getDate() + 21); // 3 weeks from now = start of week 4
  const week6End = new Date(now);
  week6End.setDate(now.getDate() + 42); // 6 weeks from now

  const startStr = week4Start.toISOString().split("T")[0];
  const endStr = week6End.toISOString().split("T")[0];

  // Fetch all activities that overlap the 4-6 week window
  const { data: activities, error } = await supabase
    .from("parsed_activities")
    .select("*")
    .eq("project_id", projectId)
    .lte("start_date", endStr)
    .gte("finish_date", startStr)
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const all = activities ?? [];

  // Categorize activities
  const milestones = all.filter(
    (a) => a.milestone || 
    /milestone|substantial completion|final inspection|certificate|turnover|closeout|punch/i.test(a.activity_name)
  );

  const inspections = all.filter(
    (a) => /inspect|inspection|test|testing|commission|walkthrough|walk-through|punchlist|punch list/i.test(a.activity_name)
  );

  const longLead = all.filter(
    (a) => /procur|fabricat|shop drawing|submittal|lead time|long lead|order|deliver|manufacture|custom|millwork|storefront|elevator|switchgear|transformer|generator|rooftop unit|ahu|chiller/i.test(a.activity_name)
  );

  // Mobilizations: activities that START in the 4-6 week window (not already in progress)
  const mobilizations = all.filter((a) => {
    if (!a.start_date) return false;
    const startDate = a.start_date.split("T")[0];
    return startDate >= startStr && 
           startDate <= endStr && 
           a.status !== "complete" && 
           a.status !== "in_progress" &&
           a.percent_complete < 10;
  });

  // Everything else that doesn't fit the above categories
  const categorizedIds = new Set([
    ...milestones.map((a) => a.id),
    ...inspections.map((a) => a.id),
    ...longLead.map((a) => a.id),
    ...mobilizations.map((a) => a.id),
  ]);

  const other = all.filter((a) => !categorizedIds.has(a.id));

  // Group mobilizations by trade for the "who needs to be on site" view
  const mobByTrade: Record<string, typeof activities> = {};
  mobilizations.forEach((a) => {
    const trade = a.trade || "General";
    if (!mobByTrade[trade]) mobByTrade[trade] = [];
    mobByTrade[trade].push(a);
  });

  // Summary stats
  const stats = {
    total: all.length,
    milestones: milestones.length,
    inspections: inspections.length,
    longLead: longLead.length,
    mobilizations: mobilizations.length,
    tradesNeeded: Object.keys(mobByTrade).length,
  };

  return NextResponse.json({
    window: { start: startStr, end: endStr },
    stats,
    milestones,
    inspections,
    longLead,
    mobilizations,
    mobilizationsByTrade: mobByTrade,
    other,
  });
}
