import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/punch-list/summary
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("punch_items")
    .select(`
      id, status, trade,
      assigned_contact:company_contacts!punch_items_assigned_to_fkey(id, name, company)
    `)
    .eq("project_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = data || [];
  const total = items.length;
  const open = items.filter((i) => i.status === "open").length;
  const in_progress = items.filter((i) => i.status === "in_progress").length;
  const ready_for_reinspect = items.filter((i) => i.status === "ready_for_reinspect").length;
  const closed = items.filter((i) => i.status === "closed").length;
  const disputed = items.filter((i) => i.status === "disputed").length;

  // By trade
  const byTradeMap: Record<string, number> = {};
  for (const item of items) {
    if (item.trade) {
      byTradeMap[item.trade] = (byTradeMap[item.trade] || 0) + 1;
    }
  }
  const by_trade = Object.entries(byTradeMap)
    .map(([trade, count]) => ({ trade, count }))
    .sort((a, b) => b.count - a.count);

  // By sub (assigned_to)
  const bySubMap: Record<string, { name: string; company: string; count: number }> = {};
  for (const item of items) {
    const contact = item.assigned_contact as { id: string; name: string; company: string } | null;
    if (contact) {
      if (!bySubMap[contact.id]) {
        bySubMap[contact.id] = { name: contact.name, company: contact.company, count: 0 };
      }
      bySubMap[contact.id].count++;
    }
  }
  const by_sub = Object.values(bySubMap).sort((a, b) => b.count - a.count);

  return NextResponse.json({
    total,
    open,
    in_progress,
    ready_for_reinspect,
    closed,
    disputed,
    by_trade,
    by_sub,
  });
}
