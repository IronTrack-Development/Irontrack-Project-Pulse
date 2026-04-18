import { getServiceClient } from "@/lib/supabase";

export type NotificationType = "ack_received" | "report_submitted" | "sub_joined";

/**
 * Creates an in-app notification for a user.
 * Fire-and-forget safe: errors are logged but not re-thrown.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("user_notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      metadata,
      read: false,
    });
    if (error) {
      console.warn("[notifications-store] insert failed:", error.message);
    }
  } catch (err) {
    console.warn("[notifications-store] unexpected error:", err);
  }
}

/**
 * Fetches unread notification count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = getServiceClient();
  const { count } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  return count ?? 0;
}

/**
 * Fetches recent notifications for a user (max 50).
 */
export async function getNotifications(userId: string) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

/**
 * Marks one or all notifications as read for a user.
 */
export async function markRead(userId: string, notificationId?: string): Promise<void> {
  const supabase = getServiceClient();
  let query = supabase
    .from("user_notifications")
    .update({ read: true })
    .eq("user_id", userId);
  if (notificationId) {
    query = query.eq("id", notificationId);
  }
  await query;
}
