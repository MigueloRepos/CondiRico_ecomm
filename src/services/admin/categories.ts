import { supabase } from "@/lib/supabase";
import { Category } from "@/types/database";
import { logAdminActivity } from "./activity";

export interface AdminCategoryWithCount extends Category {
  product_count: number;
}

export async function getAdminCategories(): Promise<AdminCategoryWithCount[]> {
  try {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[getAdminCategories] Error:", error);
      throw error;
    }

    // Get count of products for each category
    const { data: products } = await supabase.from("products").select("category_id");

    const counts: Record<string, number> = {};
    if (products) {
      products.forEach((p) => {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        }
      });
    }

    return (categories || []).map((c) => ({
      ...c,
      product_count: counts[c.id] || 0,
    }));
  } catch (err) {
    console.error("[getAdminCategories] Unexpected error:", err);
    return [];
  }
}

export async function createCategory(input: {
  id: string;
  name: string;
  short_name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}): Promise<{ success: boolean; category?: Category; error?: string }> {
  try {
    if (!input.id.trim() || !input.name.trim()) {
      return { success: false, error: "El ID y el Nombre de la categoría son obligatorios." };
    }

    const payload = {
      id: input.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      name: input.name.trim(),
      short_name: input.short_name?.trim() || input.name.trim(),
      description: input.description?.trim() || null,
      sort_order: input.sort_order !== undefined ? Number(input.sort_order) : 10,
      is_active: input.is_active !== undefined ? Boolean(input.is_active) : true,
    };

    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Error al crear categoría." };
    }

    await logAdminActivity("CATEGORY_CREATED", "categories", data.id, `Categoría creada: ${data.name}`);
    return { success: true, category: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado al crear categoría.";
    return { success: false, error: msg };
  }
}

export async function updateCategory(
  id: string,
  input: {
    name?: string;
    short_name?: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }
): Promise<{ success: boolean; category?: Category; error?: string }> {
  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.short_name !== undefined) payload.short_name = input.short_name.trim();
    if (input.description !== undefined) payload.description = input.description.trim() || null;
    if (input.sort_order !== undefined) payload.sort_order = Number(input.sort_order);
    if (input.is_active !== undefined) payload.is_active = Boolean(input.is_active);

    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Error al actualizar categoría." };
    }

    await logAdminActivity("CATEGORY_UPDATED", "categories", id, `Categoría actualizada: ${data.name}`);
    return { success: true, category: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado al actualizar categoría.";
    return { success: false, error: msg };
  }
}

export async function deleteCategory(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if category has associated products
    const { count, error: countErr } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", id);

    if (countErr) {
      console.error("[deleteCategory] Error checking products:", countErr);
    }

    if (count && count > 0) {
      return {
        success: false,
        error: `No se puede eliminar la categoría porque tiene ${count} producto(s) asignado(s). Reasigna o desactiva los productos primero.`,
      };
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      return { success: false, error: error.message };
    }

    await logAdminActivity("CATEGORY_DELETED", "categories", id, `Categoría #${id} eliminada`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al eliminar categoría.";
    return { success: false, error: msg };
  }
}
