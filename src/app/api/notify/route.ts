import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNotifications, markRead, getUnreadCount } from "@/lib/notifications-store";

// ── Auth helper: extract user from Supabase session cookie ───────────────────
async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await client.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// GET /api/notify — fetch notifications for the authenticated user
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await getNotifications(userId);
  const unreadCount = await getUnreadCount(userId);

  return NextResponse.json({ notifications, unreadCount });
}

// POST /api/notify — mark notification(s) as read
// Body: { id?: string }  — omit id to mark all as read
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine — mark all as read
  }

  await markRead(userId, body.id);
  return NextResponse.json({ success: true });
}
