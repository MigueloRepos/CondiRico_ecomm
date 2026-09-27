import { supabase } from "@/lib/supabase";
import { DashboardSummary, AdminDailySale, AdminTopProduct } from "@/types/admin";

export async function getAdminSummary(): Promise<DashboardSummary> {
  // 1. Try get_admin_dashboard RPC
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc("get_admin_dashboard");
    if (!rpcErr && rpcData) {
      return {
        active_products: Number(rpcData.active_products || 0),
        total_customers: Number(rpcData.total_customers || 0),
        total_orders: Number(rpcData.total_orders || 0),
        total_revenue: Number(rpcData.total_revenue || 0),
        pending_orders: Number(rpcData.pending_orders || 0),
        low_stock_products: Number(rpcData.low_stock_products || 0),
        unread_messages: Number(rpcData.unread_messages || 0),
        active_subscribers: Number(rpcData.active_subscribers || 0),
      };
    }
  } catch {
    // Continue to fallback view
  }

  // 2. Try admin_dashboard_summary view
  try {
    const { data: viewData, error: viewErr } = await supabase
      .from("admin_dashboard_summary")
      .select("*")
      .limit(1)
      .single();

    if (!viewErr && viewData) {
      return {
        active_products: Number(viewData.active_products || 0),
        total_customers: Number(viewData.total_customers || 0),
        total_orders: Number(viewData.total_orders || 0),
        total_revenue: Number(viewData.total_revenue || 0),
        pending_orders: Number(viewData.pending_orders || 0),
        low_stock_products: Number(viewData.low_stock_products || 0),
        unread_messages: Number(viewData.unread_messages || 0),
        active_subscribers: Number(viewData.active_subscribers || 0),
      };
    }
  } catch {
    // Continue to direct queries
  }

  // 3. Resilient direct queries
  try {
    const [
      { count: activeProds },
      { count: totalCust },
      { data: ordersData },
      { count: pendingCount },
      { count: lowStockCount },
      { count: unreadMsgs },
      { count: subCount },
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("total, status"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("products").select("*", { count: "exact", head: true }).lte("stock", 5).eq("is_active", true),
      supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
    ]);

    let revenue = 0;
    let orderCount = 0;
    if (ordersData) {
      orderCount = ordersData.length;
      ordersData.forEach((o) => {
        if (o.status !== "cancelled") {
          revenue += Number(o.total || 0);
        }
      });
    }

    return {
      active_products: activeProds || 0,
      total_customers: totalCust || 0,
      total_orders: orderCount,
      total_revenue: Number(revenue.toFixed(2)),
      pending_orders: pendingCount || 0,
      low_stock_products: lowStockCount || 0,
      unread_messages: unreadMsgs || 0,
      active_subscribers: subCount || 0,
    };
  } catch (err) {
    console.error("[getAdminSummary] Calculation error:", err);
    return {
      active_products: 0,
      total_customers: 0,
      total_orders: 0,
      total_revenue: 0,
      pending_orders: 0,
      low_stock_products: 0,
      unread_messages: 0,
      active_subscribers: 0,
    };
  }
}

export async function getDailySales(days = 30): Promise<AdminDailySale[]> {
  try {
    const { data, error } = await supabase
      .from("admin_daily_sales")
      .select("sale_date, orders_count, revenue")
      .order("sale_date", { ascending: true })
      .limit(days);

    if (!error && data && data.length > 0) {
      return data.map((d) => ({
        sale_date: String(d.sale_date),
        orders_count: Number(d.orders_count || 0),
        revenue: Number(d.revenue || 0),
      }));
    }
  } catch (err) {
    console.warn("[getDailySales] admin_daily_sales view not populated yet:", err);
  }

  // Fallback: aggregate from orders
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: orders } = await supabase
      .from("orders")
      .select("created_at, total, status")
      .gte("created_at", startDate.toISOString())
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (!orders || orders.length === 0) return [];

    const map = new Map<string, { count: number; revenue: number }>();
    orders.forEach((o) => {
      const dateKey = new Date(o.created_at).toISOString().split("T")[0];
      const curr = map.get(dateKey) || { count: 0, revenue: 0 };
      curr.count += 1;
      curr.revenue += Number(o.total || 0);
      map.set(dateKey, curr);
    });

    const result: AdminDailySale[] = [];
    map.forEach((val, date) => {
      result.push({
        sale_date: date,
        orders_count: val.count,
        revenue: Number(val.revenue.toFixed(2)),
      });
    });

    return result.sort((a, b) => a.sale_date.localeCompare(b.sale_date));
  } catch (e) {
    console.error("[getDailySales] fallback error:", e);
    return [];
  }
}

export async function getTopProducts(limit = 6): Promise<AdminTopProduct[]> {
  try {
    const { data, error } = await supabase
      .from("admin_top_products")
      .select("product_id, product_name, units_sold, revenue")
      .order("units_sold", { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map((p) => ({
        product_id: Number(p.product_id),
        product_name: String(p.product_name),
        units_sold: Number(p.units_sold || 0),
        revenue: Number(p.revenue || 0),
      }));
    }
  } catch (err) {
    console.warn("[getTopProducts] view fallback:", err);
  }

  // Fallback: calculate from order_items
  try {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, product_name, quantity, unit_price")
      .limit(150);

    if (!items || items.length === 0) return [];

    const map = new Map<number, { name: string; units: number; rev: number }>();
    items.forEach((item) => {
      const curr = map.get(item.product_id) || {
        name: item.product_name,
        units: 0,
        rev: 0,
      };
      curr.units += Number(item.quantity || 0);
      curr.rev += Number(item.unit_price || 0) * Number(item.quantity || 0);
      map.set(item.product_id, curr);
    });

    return Array.from(map.entries())
      .map(([id, val]) => ({
        product_id: id,
        product_name: val.name,
        units_sold: val.units,
        revenue: Number(val.rev.toFixed(2)),
      }))
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, limit);
  } catch (e) {
    console.error("[getTopProducts] fallback error:", e);
    return [];
  }
}

export interface DashboardAlert {
  id: string;
  type: "warning" | "info" | "urgent";
  title: string;
  message: string;
  targetTab: string;
  count?: number;
}

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = [];

  try {
    const [
      { data: lowStockProds },
      { data: pendingOrders },
      { data: newMessages },
    ] = await Promise.all([
      supabase.from("products").select("id, name, stock").lte("stock", 5).eq("is_active", true).limit(5),
      supabase.from("orders").select("id, customer_name").eq("status", "pending").limit(5),
      supabase.from("contact_messages").select("id, name, topic").eq("status", "new").limit(5),
    ]);

    if (lowStockProds && lowStockProds.length > 0) {
      alerts.push({
        id: "alert-low-stock",
        type: "urgent",
        title: `${lowStockProds.length} productos con stock crítico (≤ 5)`,
        message: `Los productos (${lowStockProds.map((p) => p.name).slice(0, 2).join(", ")}${lowStockProds.length > 2 ? "..." : ""}) requieren reabastecimiento en inventario.`,
        targetTab: "inventory",
        count: lowStockProds.length,
      });
    }

    if (pendingOrders && pendingOrders.length > 0) {
      alerts.push({
        id: "alert-pending-orders",
        type: "warning",
        title: `${pendingOrders.length} pedidos pendientes de confirmación`,
        message: `Hay pedidos nuevos esperando revisión y preparación logística.`,
        targetTab: "orders",
        count: pendingOrders.length,
      });
    }

    if (newMessages && newMessages.length > 0) {
      alerts.push({
        id: "alert-new-messages",
        type: "info",
        title: `${newMessages.length} mensajes de contacto nuevos`,
        message: `Consultas ciudadanas y de clientes sin responder en la bandeja de entrada.`,
        targetTab: "messages",
        count: newMessages.length,
      });
    }
  } catch (err) {
    console.error("[getDashboardAlerts] error:", err);
  }

  return alerts;
}
