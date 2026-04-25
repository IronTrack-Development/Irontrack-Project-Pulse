import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/safety — list toolbox talks for a project
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
    .from("toolbox_talks")
    .select("*", { count: "exact" })
    .eq("project_id", id)
    .order("talk_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get attendee counts for each talk
  if (data && data.length > 0) {
    const talkIds = data.map((t: any) => t.id);
    const { data: attendees } = await supabase
      .from("toolbox_talk_attendees")
      .select("talk_id, signed")
      .in("talk_id", talkIds);

    const countsMap: Record<string, { total: number; signed: number }> = {};
    (attendees || []).forEach((a: any) => {
      if (!countsMap[a.talk_id]) countsMap[a.talk_id] = { total: 0, signed: 0 };
      countsMap[a.talk_id].total++;
      if (a.signed) countsMap[a.talk_id].signed++;
    });

    data.forEach((t: any) => {
      t.attendee_count = countsMap[t.id]?.total || 0;
      t.signed_count = countsMap[t.id]?.signed || 0;
    });
  }

  return NextResponse.json({ talks: data, total: count });
}

// POST /api/projects/[id]/safety — create a new toolbox talk
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // If template_id is provided, pre-fill from template
  let templateData: any = {};
  if (body.template_id) {
    const { data: template } = await supabase
      .from("toolbox_talk_templates")
      .select("*")
      .eq("id", body.template_id)
      .single();

    if (template) {
      templateData = {
        topic: template.title,
        category: template.category,
        talking_points: template.talking_points,
        duration_minutes: template.duration_minutes,
      };
    }
  }

  const talkDate = body.talk_date || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("toolbox_talks")
    .insert({
      ...templateData,
      ...body,
      project_id: id,
      talk_date: talkDate,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
