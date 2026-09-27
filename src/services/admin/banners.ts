import { supabase } from "@/lib/supabase";
import { Banner } from "@/types/admin";
import { logAdminActivity } from "./activity";

export interface CreateBannerInput {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  position?: string | null;
  sort_order?: number;
  expires_at?: string | null;
  is_active?: boolean;
}

export async function getBanners(): Promise<Banner[]> {
  try {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("[getBanners] Warning:", error.message);
      return [];
    }

    return (data || []).map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      description: b.description,
      image_url: b.image_url,
      mobile_image_url: b.mobile_image_url,
      button_text: b.button_text,
      button_url: b.button_url,
      position: b.position,
      sort_order: Number(b.sort_order || 0),
      expires_at: b.expires_at,
      is_active: Boolean(b.is_active),
      created_at: b.created_at,
    }));
  } catch (err) {
    console.error("[getBanners] Error:", err);
    return [];
  }
}

export async function createBanner(
  input: CreateBannerInput
): Promise<{ success: boolean; banner?: Banner; error?: string }> {
  try {
    if (!input.title.trim() || !input.image_url.trim()) {
      return { success: false, error: "El título y la URL de imagen son obligatorios." };
    }

    const payload = {
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      description: input.description?.trim() || null,
      image_url: input.image_url.trim(),
      mobile_image_url: input.mobile_image_url?.trim() || null,
      button_text: input.button_text?.trim() || null,
      button_url: input.button_url?.trim() || null,
      position: input.position || "home_hero",
      sort_order: input.sort_order !== undefined ? Number(input.sort_order) : 1,
      expires_at: input.expires_at || null,
      is_active: input.is_active !== undefined ? Boolean(input.is_active) : true,
    };

    const { data, error } = await supabase
      .from("banners")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Error al crear banner." };
    }

    await logAdminActivity("BANNER_CREATED", "banners", data.id, `Banner creado: ${data.title}`);
    return { success: true, banner: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado.";
    return { success: false, error: msg };
  }
}

export async function updateBanner(
  id: string | number,
  input: Partial<CreateBannerInput>
): Promise<{ success: boolean; banner?: Banner; error?: string }> {
  try {
    const payload: Record<string, unknown> = {};
    if (input.title !== undefined) payload.title = input.title.trim();
    if (input.subtitle !== undefined) payload.subtitle = input.subtitle?.trim() || null;
    if (input.description !== undefined) payload.description = input.description?.trim() || null;
    if (input.image_url !== undefined) payload.image_url = input.image_url.trim();
    if (input.mobile_image_url !== undefined) payload.mobile_image_url = input.mobile_image_url?.trim() || null;
    if (input.button_text !== undefined) payload.button_text = input.button_text?.trim() || null;
    if (input.button_url !== undefined) payload.button_url = input.button_url?.trim() || null;
    if (input.position !== undefined) payload.position = input.position;
    if (input.sort_order !== undefined) payload.sort_order = Number(input.sort_order);
    if (input.expires_at !== undefined) payload.expires_at = input.expires_at || null;
    if (input.is_active !== undefined) payload.is_active = Boolean(input.is_active);

    const { data, error } = await supabase
      .from("banners")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Error al actualizar banner." };
    }

    await logAdminActivity("BANNER_UPDATED", "banners", id, `Banner actualizado: ${data.title}`);
    return { success: true, banner: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado.";
    return { success: false, error: msg };
  }
}

export async function deleteBanner(id: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) throw error;

    await logAdminActivity("BANNER_DELETED", "banners", id, `Banner #${id} eliminado`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al eliminar banner.";
    return { success: false, error: msg };
  }
}

export async function toggleBannerActive(
  id: string | number,
  currentStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateBanner(id, { is_active: !currentStatus });
}

export async function updateBannerOrder(
  id: string | number,
  newOrder: number
): Promise<{ success: boolean; error?: string }> {
  return updateBanner(id, { sort_order: newOrder });
}
