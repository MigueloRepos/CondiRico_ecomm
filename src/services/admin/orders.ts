import { supabase } from "@/lib/supabase";
import { Order, OrderItem } from "@/types/database";
import { OrderStatusHistory } from "@/types/admin";
import { logAdminActivity } from "./activity";

export interface OrderWithItems extends Order {
  items: OrderItem[];
  history?: OrderStatusHistory[];
}

export async function getAdminOrders(options?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ orders: Order[]; totalCount: number }> {
  try {
    let query = supabase.from("orders").select("*", { count: "exact" });

    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    if (options?.search?.trim()) {
      const q = options.search.trim();
      const num = parseInt(q, 10);
      if (!isNaN(num)) {
        query = query.or(`id.eq.${num},customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%`);
      } else {
        query = query.or(`customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%`);
      }
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error("[getAdminOrders] Error:", error);
      throw error;
    }

    return {
      orders: data || [],
      totalCount: count || 0,
    };
  } catch (err) {
    console.error("[getAdminOrders] Unexpected error:", err);
    return { orders: [], totalCount: 0 };
  }
}

export async function getAdminOrderById(
  id: number
): Promise<OrderWithItems | null> {
  try {
    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (oErr || !order) return null;

    const [
      { data: items },
      { data: history },
    ] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", id),
      supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at", { ascending: false }),
    ]);

    return {
      ...order,
      items: items || [],
      history: history || [],
    };
  } catch (err) {
    console.error("[getAdminOrderById] Error:", err);
    return null;
  }
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: "pending" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled" | string,
  note?: string,
  adminIdentifier?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get current order to retrieve old status
    const { data: currentOrder, error: fetchErr } = await supabase
      .from("orders")
      .select("status, customer_name, customer_email")
      .eq("id", orderId)
      .single();

    if (fetchErr || !currentOrder) {
      return { success: false, error: "Pedido no encontrado." };
    }

    const previousStatus = currentOrder.status;

    // 2. Update order status
    const { error: updErr } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updErr) {
      return { success: false, error: updErr.message };
    }

    // 3. Insert record in order_status_history
    try {
      await supabase.from("order_status_history").insert({
        order_id: orderId,
        previous_status: previousStatus,
        new_status: newStatus,
        note: note || `Estado modificado a ${newStatus}`,
        changed_by: adminIdentifier || "admin",
      });
    } catch (hErr) {
      console.warn("[updateOrderStatus] History insert warning:", hErr);
    }

    // 4. Log admin activity
    await logAdminActivity(
      "ORDER_STATUS_UPDATED",
      "orders",
      orderId,
      `Pedido #${orderId} de ${currentOrder.customer_name}: ${previousStatus} → ${newStatus}`,
      { previous_status: previousStatus, new_status: newStatus, note }
    );

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al actualizar estado del pedido.";
    return { success: false, error: msg };
  }
}
