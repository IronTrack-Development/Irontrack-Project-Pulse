import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { normalizeCompanyName } from "@/lib/company-match";
import { generateToken } from "@/lib/token-utils";

// GET /api/join/[projectId]
// Returns project info for the registration page (no auth required)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = getServiceClient();

  const { data: project, error } = await supabase
    .from("daily_projects")
    .select("id, name, location, status")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    project_id: project.id,
    project_name: project.name,
    location: project.location ?? null,
  });
}

// POST /api/join/[projectId]
// Self-register as a sub on a project. No auth required.
// Body: { company_name: string; full_name: string }
// Returns: { sub_id, token, share_url, project_name, already_existed }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = getServiceClient();

  let body: { company_name?: string; full_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const companyName = body.company_name?.trim();
  const fullName = body.full_name?.trim();

  if (!companyName) {
    return NextResponse.json({ error: "company_name is required" }, { status: 400 });
  }
  if (!fullName) {
    return NextResponse.json({ error: "full_name is required" }, { status: 400 });
  }

  // Verify the project exists
  const { data: project, error: projError } = await supabase
    .from("daily_projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const normalizedName = normalizeCompanyName(companyName);

  // Check if this company already exists on this project (by normalized name)
  const { data: existingSubs } = await supabase
    .from("project_subs")
    .select("id, sub_name")
    .eq("project_id", projectId);

  let existingSub = (existingSubs ?? []).find(
    (s) => normalizeCompanyName(s.sub_name) === normalizedName
  );

  let subId: string;
  let alreadyExisted = false;

  if (existingSub) {
    // Sub already exists — update contact name if not set
    subId = existingSub.id;
    alreadyExisted = true;

    // Update contact_name if this is a new person coming in
    await supabase
      .from("project_subs")
      .update({ contact_name: fullName })
      .eq("id", subId);
  } else {
    // Create new project_subs entry
    const { data: newSub, error: insertError } = await supabase
      .from("project_subs")
      .insert({
        project_id: projectId,
        sub_name: companyName,
        contact_name: fullName,
        trades: [],
        activity_ids: null,
        notes: null,
      })
      .select("id, sub_name")
      .single();

    if (insertError || !newSub) {
      // If unique constraint hit (race condition), try to find existing
      if (insertError?.code === "23505") {
        const { data: raceExisting } = await supabase
          .from("project_subs")
          .select("id, sub_name")
          .eq("project_id", projectId)
          .eq("sub_name", companyName)
          .single();
        if (raceExisting) {
          subId = raceExisting.id;
          alreadyExisted = true;
        } else {
          return NextResponse.json({ error: "Failed to create sub entry" }, { status: 500 });
        }
      } else {
        return NextResponse.json(
          { error: insertError?.message ?? "Failed to create sub entry" },
          { status: 500 }
        );
      }
    } else {
      subId = newSub.id;

      // Try to match to existing sub_companies by normalized name
      try {
        const { data: companies } = await supabase
          .from("sub_companies")
          .select("id, company_name");
        if (companies && companies.length > 0) {
          const match = companies.find(
            (c) => normalizeCompanyName(c.company_name) === normalizedName
          );
          if (match) {
            await supabase
              .from("project_subs")
              .update({ sub_company_id: match.id })
              .eq("id", subId);
          }
        }
      } catch {
        // Best-effort — never fail the request
      }
    }
  }

  // Generate a share link token for this sub
  let token = generateToken();
  let shareData = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await supabase
      .from("sub_share_links")
      .insert({
        project_id: projectId,
        sub_id: subId,
        token,
        label: `Self-registered: ${fullName}`,
        active: true,
      })
      .select()
      .single();

    if (!result.error) {
      shareData = result.data;
      break;
    }

    if (result.error.code === "23505" && attempt === 0) {
      // Token collision — regenerate
      token = generateToken();
    } else {
      return NextResponse.json(
        { error: result.error.message ?? "Failed to generate share link" },
        { status: 500 }
      );
    }
  }

  if (!shareData) {
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get("host")}`;
  const shareUrl = `${baseUrl}/view/${token}`;

  return NextResponse.json(
    {
      sub_id: subId,
      token,
      share_url: shareUrl,
      project_name: project.name,
      already_existed: alreadyExisted,
    },
    { status: 201 }
  );
}
