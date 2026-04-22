import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

/**
 * POST /api/projects/[id]/schedule/export-mspdi
 * 
 * Export the current (or reforecasted) schedule as MSPDI XML.
 * 
 * This calls the mspdi-generator Railway service to produce the XML file.
 * If the service is not available, returns the payload that would be sent
 * so the user can use it later.
 * 
 * Body (optional): { snapshot_id?: string }  — export from a specific snapshot
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine
  }

  // 1. Fetch project
  const { data: project, error: projErr } = await supabase
    .from("daily_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // 2. Get task data — from snapshot or live DB
  let taskData: Record<string, any>[];

  if (body.snapshot_id) {
    const { data: snapshot, error: snapErr } = await supabase
      .from("schedule_snapshots")
      .select("task_data")
      .eq("id", body.snapshot_id)
      .eq("project_id", projectId)
      .single();

    if (snapErr || !snapshot?.task_data) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }
    taskData = snapshot.task_data;
  } else {
    const { data: activities, error: actErr } = await supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", projectId)
      .order("start_date", { ascending: true });

    if (actErr || !activities) {
      return NextResponse.json({ error: actErr?.message || "No activities" }, { status: 500 });
    }
    taskData = activities;
  }

  // 3. Build MSPDI payload for the generator service
  const mspdiPayload = {
    projectName: project.name,
    projectStartDate: project.start_date,
    activities: taskData.map((task: Record<string, any>) => ({
      activity: task.activity_name,
      phase: task.normalized_phase || task.wbs || "Construction",
      startDate: task.forecast_start || task.start_date,
      endDate: task.forecast_finish || task.finish_date,
      duration: task.remaining_duration || task.original_duration || 0,
      duration_unit: "Work Days",
      isCriticalPath: task.is_critical || false,
      responsible: task.trade || "",
      notes: [
        task.status !== "not_started" ? `Status: ${task.status}` : null,
        task.percent_complete > 0 ? `Progress: ${task.percent_complete}%` : null,
        task.total_float !== null && task.total_float !== undefined ? `Float: ${task.total_float}d` : null,
        task.actual_start ? `Actual Start: ${task.actual_start}` : null,
        task.actual_finish ? `Actual Finish: ${task.actual_finish}` : null,
      ].filter(Boolean).join(" | "),
      // Dependencies (for predecessor wiring)
      dependencies: task.dependency_links
        ? task.dependency_links.map((l: any) => {
            const pred = taskData.find((t: any) => t.id === l.predecessor_id);
            return pred ? pred.activity_name : "";
          }).filter(Boolean).join(", ")
        : "",
    })),
  };

  // 4. Try calling mspdi-generator service
  const mspdiUrl = process.env.MSPDI_GENERATOR_URL;
  const mspdiKey = process.env.MSPDI_GENERATOR_API_KEY;

  if (mspdiUrl && mspdiKey) {
    try {
      const res = await fetch(`${mspdiUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mspdiKey}`,
        },
        body: JSON.stringify(mspdiPayload),
      });

      if (res.ok) {
        const xmlBuffer = await res.arrayBuffer();
        const filename = `${project.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Reforecast.xml`;

        return new NextResponse(xmlBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/xml",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      } else {
        const errBody = await res.text();
        console.error("MSPDI generator error:", errBody);
        // Fall through to return payload
      }
    } catch (err) {
      console.error("MSPDI generator unreachable:", err);
      // Fall through to return payload
    }
  }

  // 5. Service not available — return the payload + instructions
  return NextResponse.json({
    message: "MSPDI generator service not configured or unavailable. Returning export payload.",
    service_required: true,
    payload: mspdiPayload,
    task_count: taskData.length,
    project_name: project.name,
    instructions: "Deploy the mspdi-generator service to Railway and set MSPDI_GENERATOR_URL and MSPDI_GENERATOR_API_KEY environment variables in Vercel.",
  });
}
