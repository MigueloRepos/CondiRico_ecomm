import { supabase } from "@/lib/supabase";
import { AdminActivityLog } from "@/types/admin";

export async function getActivityLog(limit = 50): Promise<AdminActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from("admin_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[getActivityLog] Supabase warning:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[getActivityLog] Unexpected error:", err);
    return [];
  }
}

export async function logAdminActivity(
  action: string,
  entityType?: string,
  entityId?: string | number,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const payload = {
      action,
      entity_type: entityType || null,
      entity_id: entityId ? String(entityId) : null,
      description: description || null,
      metadata: metadata || null,
    };

    const { error } = await supabase.from("admin_activity_log").insert(payload);
    if (error) {
      console.warn("[logAdminActivity] notice:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[logAdminActivity] error:", err);
    return false;
  }
}
