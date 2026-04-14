import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const activityId = searchParams.get("activity_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("ready_checks")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (activityId) query = query.eq("activity_id", activityId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const {
    activity_id,
    contact_name,
    contact_company,
    contact_phone,
    contact_email,
    activity_name,
    trade,
    start_date,
    normalized_building,
    check_type = "standard",
    message_text,
    send_method,
    contact_id: existingContactId,
  } = body;

  // Upsert contact for this trade
  let contact_id = existingContactId || null;
  if (contact_name && trade) {
    // Look for existing contact for this project/trade
    const { data: existingContacts } = await supabase
      .from("ready_check_contacts")
      .select("id")
      .eq("project_id", id)
      .eq("trade", trade)
      .eq("contact_name", contact_name)
      .limit(1);

    if (existingContacts && existingContacts.length > 0) {
      // Update existing contact with fresh info
      contact_id = existingContacts[0].id;
      await supabase
        .from("ready_check_contacts")
        .update({
          phone: contact_phone || null,
          email: contact_email || null,
          company: contact_company || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contact_id);
    } else {
      // Create new contact
      const { data: newContact, error: contactError } = await supabase
        .from("ready_check_contacts")
        .insert({
          project_id: id,
          trade,
          contact_name,
          phone: contact_phone || null,
          email: contact_email || null,
          company: contact_company || null,
        })
        .select()
        .single();

      if (!contactError && newContact) {
        contact_id = newContact.id;
      }
    }
  }

  // Create the ready check
  const { data, error } = await supabase
    .from("ready_checks")
    .insert({
      project_id: id,
      activity_id: activity_id || null,
      contact_id,
      contact_name,
      contact_company: contact_company || null,
      contact_phone: contact_phone || null,
      contact_email: contact_email || null,
      activity_name,
      trade: trade || null,
      start_date: start_date || null,
      normalized_building: normalized_building || null,
      check_type,
      message_text,
      send_method: send_method || null,
      status: "awaiting_response",
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
