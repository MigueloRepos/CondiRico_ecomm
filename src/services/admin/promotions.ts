import { supabase } from "@/lib/supabase";
import { Promotion } from "@/types/admin";
import { logAdminActivity } from "./activity";

export interface CreatePromotionInput {
  code: string;
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed" | string;
  discount_value: number;
  usage_limit?: number | null;
  expires_at?: string | null;
  is_active?: boolean;
}

export async function getPromotions(): Promise<Promotion[]> {
  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[getPromotions] Warning:", error.message);
      return [];
    }

    return (data || []).map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      discount_type: p.discount_type,
      discount_value: Number(p.discount_value || 0),
      usage_limit: p.usage_limit ? Number(p.usage_limit) : null,
      expires_at: p.expires_at,
      is_active: Boolean(p.is_active),
      created_at: p.created_at,
    }));
  } catch (err) {
    console.error("[getPromotions] Error:", err);
    return [];
  }
}

export async function createPromotion(
  input: CreatePromotionInput
): Promise<{ success: boolean; promotion?: Promotion; error?: string }> {
  try {
    if (!input.code.trim() || !input.name.trim()) {
      return { success: false, error: "El código y nombre del cupón son obligatorios." };
    }
    if (input.discount_value <= 0) {
      return { success: false, error: "El valor del descuento debe ser mayor a 0." };
    }

    const payload = {
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      discount_type: input.discount_type || "percentage",
      discount_value: Number(input.discount_value),
      usage_limit: input.usage_limit ? Number(input.usage_limit) : null,
      expires_at: input.expires_at || null,
      is_active: input.is_active !== undefined ? Boolean(input.is_active) : true,
    };

    const { data, error } = await supabase
      .from("promotions")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Error al crear promoción." };
    }

    await logAdminActivity("PROMOTION_CREATED", "promotions", data.id, `Promoción creada: ${data.code} (${data.name})`);
    return { success: true, promotion: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado.";
    return { success: false, error: msg };
  }
}

export async function updatePromotion(
  id: string | number,
  input: Partial<CreatePromotionInput>
): Promise<{ success: boolean; promotion?: Promotion; error?: string }> {
  try {
    const payload: Record<string, unknown> = {};
    if (input.code !== undefined) payload.code = input.code.trim().toUpperCase();
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.description !== undefined) payload.description = input.description.trim() || null;
    if (input.discount_type !== undefined) payload.discount_type = input.discount_type;
    if (input.discount_value !== undefined) payload.discount_value = Number(input.discount_value);
    if (input.usage_limit !== undefined) payload.usage_limit = input.usage_limit ? Number(input.usage_limit) : null;
    if (input.expires_at !== undefined) payload.expires_at = input.expires_at || null;
    if (input.is_active !== undefined) payload.is_active = Boolean(input.is_active);

    const { data, error } = await supabase
      .from("promotions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Error al actualizar promoción." };
    }

    await logAdminActivity("PROMOTION_UPDATED", "promotions", id, `Promoción actualizada: ${data.code}`);
    return { success: true, promotion: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado.";
    return { success: false, error: msg };
  }
}

export async function deletePromotion(id: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) throw error;

    await logAdminActivity("PROMOTION_DELETED", "promotions", id, `Promoción #${id} eliminada`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al eliminar promoción.";
    return { success: false, error: msg };
  }
}

export async function togglePromotionActive(
  id: string | number,
  currentStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  return updatePromotion(id, { is_active: !currentStatus });
}
