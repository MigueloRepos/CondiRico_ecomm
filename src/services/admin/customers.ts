import { supabase } from "@/lib/supabase";
import { CustomerWithStats, CustomerNote } from "@/types/admin";
import { Order } from "@/types/database";
import { logAdminActivity } from "./activity";

export async function getAdminCustomers(searchQuery?: string): Promise<CustomerWithStats[]> {
  try {
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim();
      query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`);
    }

    const { data: profiles, error } = await query;
    if (error) throw error;

    // Fetch order statistics per customer
    const { data: orders } = await supabase.from("orders").select("user_id, total, status, created_at");

    const ordersMap = new Map<string, { count: number; total: number; lastDate: string | null }>();
    if (orders) {
      orders.forEach((o) => {
        if (o.user_id) {
          const curr = ordersMap.get(o.user_id) || { count: 0, total: 0, lastDate: null };
          curr.count += 1;
          if (o.status !== "cancelled") {
            curr.total += Number(o.total || 0);
          }
          if (!curr.lastDate || new Date(o.created_at) > new Date(curr.lastDate)) {
            curr.lastDate = o.created_at;
          }
          ordersMap.set(o.user_id, curr);
        }
      });
    }

    return (profiles || []).map((p) => {
      const stats = ordersMap.get(p.id) || { count: 0, total: 0, lastDate: null };
      return {
        ...p,
        orders_count: stats.count,
        total_spent: Number(stats.total.toFixed(2)),
        last_order_date: stats.lastDate,
      };
    });
  } catch (err) {
    console.error("[getAdminCustomers] Error:", err);
    return [];
  }
}

export interface CustomerFullDetail {
  customer: CustomerWithStats;
  orders: Order[];
  notes: CustomerNote[];
}

export async function getCustomerDetails(customerId: string): Promise<CustomerFullDetail | null> {
  try {
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", customerId)
      .single();

    if (pErr || !profile) return null;

    const [
      { data: orders },
      { data: notes },
    ] = await Promise.all([
      supabase.from("orders").select("*").eq("user_id", customerId).order("created_at", { ascending: false }),
      supabase.from("customer_notes").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }),
    ]);

    let totalSpent = 0;
    (orders || []).forEach((o) => {
      if (o.status !== "cancelled") {
        totalSpent += Number(o.total || 0);
      }
    });

    const customerWithStats: CustomerWithStats = {
      ...profile,
      orders_count: (orders || []).length,
      total_spent: Number(totalSpent.toFixed(2)),
      last_order_date: orders && orders[0] ? orders[0].created_at : null,
    };

    return {
      customer: customerWithStats,
      orders: orders || [],
      notes: notes || [],
    };
  } catch (err) {
    console.error("[getCustomerDetails] Error:", err);
    return null;
  }
}

export async function addCustomerNote(
  customerId: string,
  note: string,
  adminIdentifier?: string
): Promise<{ success: boolean; noteRecord?: CustomerNote; error?: string }> {
  try {
    if (!note.trim()) {
      return { success: false, error: "La nota no puede estar vacía." };
    }

    const payload = {
      customer_id: customerId,
      note: note.trim(),
    };

    const { data, error } = await supabase
      .from("customer_notes")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Error al agregar nota." };
    }

    await logAdminActivity(
      "CUSTOMER_NOTE_ADDED",
      "customer_notes",
      data.id,
      `Nota interna agregada a cliente ${customerId}`
    );

    return { success: true, noteRecord: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado.";
    return { success: false, error: msg };
  }
}
