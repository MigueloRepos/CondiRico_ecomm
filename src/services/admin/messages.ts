import { supabase } from "@/lib/supabase";
import { ContactMessage } from "@/types/database";
import { logAdminActivity } from "./activity";

export async function getAdminMessages(statusFilter?: string): Promise<ContactMessage[]> {
  try {
    let query = supabase.from("contact_messages").select("*").order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("[getAdminMessages] Error:", err);
    return [];
  }
}

export async function updateMessageStatus(
  id: number,
  newStatus: "new" | "read" | "in_progress" | "resolved" | "archived" | string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("contact_messages")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) throw error;

    await logAdminActivity("MESSAGE_STATUS_UPDATED", "contact_messages", id, `Mensaje #${id} cambiado a: ${newStatus}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al actualizar mensaje.";
    return { success: false, error: msg };
  }
}

export async function deleteMessage(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) throw error;

    await logAdminActivity("MESSAGE_DELETED", "contact_messages", id, `Mensaje #${id} eliminado`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al eliminar mensaje.";
    return { success: false, error: msg };
  }
}
