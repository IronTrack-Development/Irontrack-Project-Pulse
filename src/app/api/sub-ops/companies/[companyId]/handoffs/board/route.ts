import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getServiceClient();

  // Get departments sorted
  const { data: departments, error: deptError } = await supabase
    .from("sub_departments")
    .select("id, name, color, sort_order")
    .eq("company_id", companyId)
    .order("sort_order");

  if (deptError) return NextResponse.json({ error: deptError.message }, { status: 500 });

  // Get areas
  const { data: areas, error: areaError } = await supabase
    .from("sub_handoff_areas")
    .select("id, project_name, area_name, description")
    .eq("company_id", companyId)
    .order("created_at");

  if (areaError) return NextResponse.json({ error: areaError.message }, { status: 500 });

  // Get all handoffs for this company
  const { data: handoffs, error: handoffError } = await supabase
    .from("sub_handoffs")
    .select("id, area_id, from_department_id, to_department_id, status, handoff_date, accepted_date, notes")
    .eq("company_id", companyId);

  if (handoffError) return NextResponse.json({ error: handoffError.message }, { status: 500 });

  // Build board: for each area, map department pairs to handoff status
  const deptList = departments || [];
  const board = (areas || []).map((area: Record<string, unknown>) => {
    // For each consecutive department pair, find the handoff
    const cells: Record<string, unknown>[] = [];

    for (let i = 0; i < deptList.length - 1; i++) {
      const fromDept = deptList[i] as Record<string, unknown>;
      const toDept = deptList[i + 1] as Record<string, unknown>;

      const handoff = (handoffs || []).find(
        (h: Record<string, unknown>) =>
          h.area_id === area.id &&
          h.from_department_id === fromDept.id &&
          h.to_department_id === toDept.id
      );

      cells.push({
        from_department_id: fromDept.id,
        from_department_name: fromDept.name,
        to_department_id: toDept.id,
        to_department_name: toDept.name,
        handoff_id: handoff ? (handoff as Record<string, unknown>).id : null,
        status: handoff ? (handoff as Record<string, unknown>).status : "not_started",
      });
    }

    return {
      area_id: area.id,
      project_name: area.project_name,
      area_name: area.area_name,
      description: area.description,
      cells,
    };
  });

  return NextResponse.json({
    departments: deptList,
    areas: board,
  });
}
