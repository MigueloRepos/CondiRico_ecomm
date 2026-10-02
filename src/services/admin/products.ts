import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import { logAdminActivity } from "./activity";
import { recordStockMovement } from "./inventory";

export interface CreateProductInput {
  name: string;
  slug?: string;
  detail?: string;
  price: number;
  old_price?: number | null;
  category_id: string;
  badge?: string | null;
  unit: string;
  rating?: number;
  reviews?: number;
  is_popular?: boolean;
  is_featured?: boolean;
  stock: number;
  is_active?: boolean;
  image_url?: string | null;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: number;
}

export async function getAdminProducts(options?: {
  categoryId?: string;
  searchQuery?: string;
  onlyActive?: boolean;
  lowStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ products: Product[]; totalCount: number }> {
  try {
    let query = supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          short_name
        )
      `, { count: "exact" });

    if (options?.categoryId && options.categoryId !== "all") {
      query = query.eq("category_id", options.categoryId);
    }

    if (options?.onlyActive !== undefined) {
      query = query.eq("is_active", options.onlyActive);
    }

    if (options?.lowStockOnly) {
      query = query.lte("stock", 5);
    }

    if (options?.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.trim();
      query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,detail.ilike.%${q}%`);
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order("id", { ascending: true }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error("[getAdminProducts] Error:", error);
      throw error;
    }

    return {
      products: data || [],
      totalCount: count || 0,
    };
  } catch (err) {
    console.error("[getAdminProducts] Unexpected error:", err);
    return { products: [], totalCount: 0 };
  }
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createAdminProduct(
  input: CreateProductInput
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    if (!input.name || !input.name.trim()) {
      return { success: false, error: "El nombre del producto es obligatorio." };
    }
    if (input.price === undefined || input.price < 0) {
      return { success: false, error: "El precio no puede ser negativo." };
    }
    if (input.stock === undefined || input.stock < 0) {
      return { success: false, error: "El inventario inicial no puede ser negativo." };
    }
    const rating = input.rating !== undefined ? Math.max(0, Math.min(5, input.rating)) : 5.0;

    // 1. Ensure category exists in public.categories to avoid foreign key restriction
    let categoryId = input.category_id ? input.category_id.trim() : "alimentos";
    if (categoryId) {
      try {
        const { data: existingCat } = await supabase
          .from("categories")
          .select("id")
          .eq("id", categoryId)
          .maybeSingle();

        if (!existingCat) {
          // Auto-provision category if not in database yet
          const catName = categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace(/-/g, " ");
          await supabase.from("categories").insert({
            id: categoryId,
            name: catName,
            short_name: catName,
            is_active: true,
            sort_order: 10,
          });
        }
      } catch (catCheckErr) {
        console.warn("[createAdminProduct] Category check notice:", catCheckErr);
      }
    }

    // 2. Generate slug safely and handle uniqueness
    let baseSlug = input.slug?.trim() || generateSlug(input.name);
    if (!baseSlug) baseSlug = `producto-${Date.now().toString().slice(-6)}`;

    // Prepare payload
    const buildPayload = (slugToUse: string) => ({
      name: input.name.trim(),
      slug: slugToUse,
      detail: input.detail?.trim() || "",
      price: Number(input.price),
      old_price: input.old_price ? Number(input.old_price) : null,
      category_id: categoryId,
      badge: input.badge?.trim() || null,
      unit: input.unit?.trim() || "unidad",
      rating,
      reviews: input.reviews !== undefined ? Number(input.reviews) : 0,
      is_popular: Boolean(input.is_popular),
      is_featured: Boolean(input.is_featured),
      stock: Number(input.stock),
      is_active: input.is_active !== undefined ? Boolean(input.is_active) : true,
      image_url: input.image_url?.trim() || null,
    });

    let { data, error } = await supabase
      .from("products")
      .insert(buildPayload(baseSlug))
      .select()
      .single();

    // If duplicate slug constraint occurred, retry with unique suffix
    if (error && (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("slug"))) {
      const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
      const retryResult = await supabase
        .from("products")
        .insert(buildPayload(uniqueSlug))
        .select()
        .single();

      data = retryResult.data;
      error = retryResult.error;
    }

    if (error || !data) {
      console.error("[createAdminProduct] Supabase Error:", error);
      let userFriendlyError = error?.message || "Error al registrar producto en Supabase.";

      if (error?.code === "42501" || error?.message?.includes("row-level security")) {
        userFriendlyError = "Permiso denegado por políticas de Supabase. Concede el rol 'admin' en la tabla public.profiles a tu cuenta.";
      } else if (error?.code === "23503" || error?.message?.includes("foreign key")) {
        userFriendlyError = `La categoría "${categoryId}" no existe en la base de datos de Supabase. Por favor selecciónala de la lista o créala primero.`;
      }

      return { success: false, error: userFriendlyError };
    }

    // 3. Non-blocking activity log
    try {
      await logAdminActivity(
        "PRODUCT_CREATED",
        "products",
        data.id,
        `Producto creado: ${data.name} ($${data.price})`,
        { stock: data.stock, category: data.category_id }
      );
    } catch (logErr) {
      console.warn("[createAdminProduct] Activity log notice:", logErr);
    }

    // 4. Non-blocking stock movement record
    if (data.stock > 0) {
      try {
        await recordStockMovement({
          product_id: data.id,
          movement_type: "entrada",
          quantity: data.stock,
          previous_stock: 0,
          new_stock: data.stock,
          reason: "Inventario inicial al crear producto",
        });
      } catch (stockErr) {
        console.warn("[createAdminProduct] Stock movement notice:", stockErr);
      }
    }

    return { success: true, product: data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error inesperado al crear producto.";
    return { success: false, error: errorMsg };
  }
}

export async function updateAdminProduct(
  input: UpdateProductInput
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    if (input.price !== undefined && input.price < 0) {
      return { success: false, error: "El precio no puede ser negativo." };
    }
    if (input.stock !== undefined && input.stock < 0) {
      return { success: false, error: "El stock no puede ser negativo." };
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.slug !== undefined) payload.slug = input.slug.trim() || generateSlug(input.name || "");
    if (input.detail !== undefined) payload.detail = input.detail?.trim() || "";
    if (input.price !== undefined) payload.price = Number(input.price);
    if (input.old_price !== undefined) payload.old_price = input.old_price ? Number(input.old_price) : null;
    if (input.category_id !== undefined) payload.category_id = input.category_id;
    if (input.badge !== undefined) payload.badge = input.badge?.trim() || null;
    if (input.unit !== undefined) payload.unit = input.unit.trim();
    if (input.rating !== undefined) payload.rating = Math.max(0, Math.min(5, input.rating));
    if (input.reviews !== undefined) payload.reviews = input.reviews;
    if (input.is_popular !== undefined) payload.is_popular = Boolean(input.is_popular);
    if (input.is_featured !== undefined) payload.is_featured = Boolean(input.is_featured);
    if (input.stock !== undefined) payload.stock = Number(input.stock);
    if (input.is_active !== undefined) payload.is_active = Boolean(input.is_active);
    if (input.image_url !== undefined) payload.image_url = input.image_url?.trim() || null;

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", input.id)
      .select()
      .single();

    if (error || !data) {
      console.error("[updateAdminProduct] Error:", error);
      return { success: false, error: error?.message || "Error al actualizar producto." };
    }

    await logAdminActivity(
      "PRODUCT_UPDATED",
      "products",
      input.id,
      `Producto actualizado: ${data.name}`,
      payload
    );

    return { success: true, product: data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error inesperado al actualizar producto.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteAdminProduct(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if product is in order_items
    const { count: itemsCount } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id);

    if (itemsCount && itemsCount > 0) {
      // Instead of hard delete, deactivate to protect historical order integrity
      await supabase.from("products").update({ is_active: false }).eq("id", id);
      await logAdminActivity(
        "PRODUCT_DEACTIVATED",
        "products",
        id,
        `Producto desactivado (posee pedidos históricos asociados)`
      );
      return {
        success: true,
        error: "El producto tiene pedidos históricos asociados. Para preservar el historial contable, se ha desactivado del catálogo en lugar de borrarse permanentemente.",
      };
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("[deleteAdminProduct] Error:", error);
      return { success: false, error: error.message };
    }

    await logAdminActivity("PRODUCT_DELETED", "products", id, `Producto #${id} eliminado definitivamente`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al eliminar producto.";
    return { success: false, error: errorMsg };
  }
}

export async function toggleProductActive(
  id: number,
  currentStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateAdminProduct({ id, is_active: !currentStatus });
}

export async function updateProductStockQuick(
  id: number,
  newStock: number,
  reason = "Ajuste rápido de inventario"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: curr } = await supabase
      .from("products")
      .select("stock, name")
      .eq("id", id)
      .single();

    const prev = curr?.stock || 0;
    const diff = newStock - prev;
    const movementType = diff >= 0 ? "entrada" : "salida";

    const { error } = await supabase
      .from("products")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    await recordStockMovement({
      product_id: id,
      movement_type: movementType,
      quantity: Math.abs(diff),
      previous_stock: prev,
      new_stock: newStock,
      reason,
    });

    await logAdminActivity(
      "STOCK_UPDATED",
      "products",
      id,
      `Stock actualizado para ${curr?.name || '#' + id}: ${prev} → ${newStock} (${reason})`
    );

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al actualizar stock.";
    return { success: false, error: errorMsg };
  }
}
