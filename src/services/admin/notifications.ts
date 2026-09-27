import { supabase } from "@/lib/supabase";
import { AdminNotification } from "@/types/admin";

export async function getAdminNotifications(limit = 30): Promise<AdminNotification[]> {
  try {
    const { data, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[getAdminNotifications] Warning:", error.message);
      return [];
    }

    return (data || []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      is_read: Boolean(n.is_read),
      link: n.link,
      created_at: n.created_at,
    }));
  } catch (err) {
    console.error("[getAdminNotifications] Error:", err);
    return [];
  }
}

export async function markNotificationRead(id: string | number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("id", id);

    return !error;
  } catch {
    return false;
  }
}

export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    return !error;
  } catch {
    return false;
  }
}
