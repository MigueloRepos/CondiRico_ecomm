import { supabase } from "@/lib/supabase";
import { StockMovement } from "@/types/admin";
import { Product } from "@/types/database";

export interface RecordMovementInput {
  product_id: number;
  movement_type: "entrada" | "salida" | "ajuste" | "devolucion" | "danado" | string;
  quantity: number;
  previous_stock?: number;
  new_stock?: number;
  reason?: string | null;
  created_by?: string | null;
}

export async function recordStockMovement(
  input: RecordMovementInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      product_id: input.product_id,
      movement_type: input.movement_type,
      quantity: Number(input.quantity),
      previous_stock: input.previous_stock !== undefined ? Number(input.previous_stock) : null,
      new_stock: input.new_stock !== undefined ? Number(input.new_stock) : null,
      reason: input.reason || null,
      created_by: input.created_by || null,
    };

    const { error } = await supabase.from("stock_movements").insert(payload);
    if (error) {
      console.warn("[recordStockMovement] notice:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al registrar movimiento.";
    return { success: false, error: msg };
  }
}

export async function getStockMovements(
  productId?: number,
  limit = 40
): Promise<StockMovement[]> {
  try {
    let query = supabase
      .from("stock_movements")
      .select(`
        *,
        product:products (
          name,
          unit
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[getStockMovements] Error:", error.message);
      return [];
    }

    return (data || []).map((d) => ({
      id: d.id,
      product_id: d.product_id,
      movement_type: d.movement_type,
      quantity: Number(d.quantity || 0),
      previous_stock: d.previous_stock !== null ? Number(d.previous_stock) : undefined,
      new_stock: d.new_stock !== null ? Number(d.new_stock) : undefined,
      reason: d.reason,
      created_by: d.created_by,
      created_at: d.created_at,
      product: d.product ? { name: d.product.name, unit: d.product.unit } : undefined,
    }));
  } catch (err) {
    console.error("[getStockMovements] Unexpected error:", err);
    return [];
  }
}

export interface InventoryItem extends Product {
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  last_movement?: StockMovement | null;
}

export async function getInventoryItems(filter?: {
  status?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  search?: string;
  lowStockThreshold?: number;
}): Promise<InventoryItem[]> {
  const threshold = filter?.lowStockThreshold ?? 5;
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
      `)
      .order("stock", { ascending: true });

    if (filter?.search?.trim()) {
      const q = filter.search.trim();
      query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const items: InventoryItem[] = (data || []).map((p) => {
      let stock_status: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
      if (p.stock <= 0) {
        stock_status = "out_of_stock";
      } else if (p.stock <= threshold) {
        stock_status = "low_stock";
      }

      return {
        ...p,
        stock_status,
      };
    });

    if (filter?.status && filter.status !== "all") {
      return items.filter((i) => i.stock_status === filter.status);
    }

    return items;
  } catch (err) {
    console.error("[getInventoryItems] Error:", err);
    return [];
  }
}

export async function applyStockMovement(
  productId: number,
  movementType: "entrada" | "salida" | "ajuste" | "devolucion" | "danado",
  qty: number,
  reason: string,
  userEmail?: string
): Promise<{ success: boolean; newStock?: number; error?: string }> {
  try {
    const { data: prod, error: pErr } = await supabase
      .from("products")
      .select("stock, name")
      .eq("id", productId)
      .single();

    if (pErr || !prod) {
      return { success: false, error: "Producto no encontrado." };
    }

    const prevStock = prod.stock || 0;
    let newStock = prevStock;

    if (movementType === "entrada" || movementType === "devolucion") {
      newStock = prevStock + qty;
    } else if (movementType === "salida" || movementType === "danado") {
      newStock = Math.max(0, prevStock - qty);
    } else if (movementType === "ajuste") {
      newStock = Math.max(0, qty); // In adjustment, qty is the new absolute stock
    }

    const { error: updErr } = await supabase
      .from("products")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", productId);

    if (updErr) throw updErr;

    await recordStockMovement({
      product_id: productId,
      movement_type: movementType,
      quantity: movementType === "ajuste" ? Math.abs(newStock - prevStock) : qty,
      previous_stock: prevStock,
      new_stock: newStock,
      reason,
      created_by: userEmail || "admin",
    });

    return { success: true, newStock };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al procesar movimiento de stock.";
    return { success: false, error: msg };
  }
}
