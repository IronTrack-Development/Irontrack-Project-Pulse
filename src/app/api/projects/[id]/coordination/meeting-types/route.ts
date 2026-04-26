import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET — list meeting types (system + project-custom)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("coordination_meeting_types")
    .select("*")
    .or(`project_id.eq.${id},project_id.is.null`)
    .order("is_system", { ascending: false })
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meeting_types: data });
}

// POST — create custom meeting type
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("coordination_meeting_types")
    .insert({
      project_id: id,
      name: body.name,
      default_agenda: body.default_agenda || [],
      default_duration_minutes: body.default_duration_minutes || 60,
      is_system: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
