import { supabase } from "@/lib/supabase";
import { NewsletterSubscriber } from "@/types/database";
import { logAdminActivity } from "./activity";

export async function getAdminSubscribers(searchQuery?: string): Promise<NewsletterSubscriber[]> {
  try {
    let query = supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });

    if (searchQuery && searchQuery.trim()) {
      query = query.ilike("email", `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("[getAdminSubscribers] Error:", err);
    return [];
  }
}

export async function toggleSubscriberStatus(
  id: number,
  currentStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) throw error;

    await logAdminActivity(
      "SUBSCRIBER_STATUS_CHANGED",
      "newsletter_subscribers",
      id,
      `Suscriptor #${id} cambiado a ${!currentStatus ? 'Activo' : 'Inactivo'}`
    );

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al cambiar estado.";
    return { success: false, error: msg };
  }
}

export async function deleteSubscriber(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) throw error;

    await logAdminActivity("SUBSCRIBER_DELETED", "newsletter_subscribers", id, `Suscriptor #${id} eliminado`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al eliminar suscriptor.";
    return { success: false, error: msg };
  }
}
