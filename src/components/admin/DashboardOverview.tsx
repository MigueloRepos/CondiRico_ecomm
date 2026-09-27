import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Clock,
  AlertTriangle,
  Mail,
  MessageSquare,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  DashboardSummary,
  AdminDailySale,
  AdminTopProduct,
} from "@/types/admin";
import { Order } from "@/types/database";
import {
  getAdminSummary,
  getDailySales,
  getTopProducts,
  getDashboardAlerts,
  DashboardAlert,
} from "@/services/admin/dashboard";
import { getAdminOrders } from "@/services/admin/orders";

interface DashboardOverviewProps {
  onNavigateTab: (tab: string, param?: string | number) => void;
  onOpenOrderModal: (orderId: number) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateTab,
  onOpenOrderModal,
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dailySales, setDailySales] = useState<AdminDailySale[]>([]);
  const [topProducts, setTopProducts] = useState<AdminTopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [chartPeriod, setChartPeriod] = useState<"7" | "30" | "90" | "365">("30");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const days = parseInt(chartPeriod, 10) || 30;
      const [
        sumData,
        salesData,
        topProds,
        ordersRes,
        alertsData,
      ] = await Promise.all([
        getAdminSummary(),
        getDailySales(days),
        getTopProducts(5),
        getAdminOrders({ pageSize: 6 }),
        getDashboardAlerts(),
      ]);

      setSummary(sumData);
      setDailySales(salesData);
      setTopProducts(topProds);
      setRecentOrders(ordersRes.orders);
      setAlerts(alertsData);
    } catch (err) {
      console.error("[DashboardOverview] Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [chartPeriod]);

  // Chart data calculations
  const maxRevenue = useMemo(() => {
    if (dailySales.length === 0) return 100;
    const max = Math.max(...dailySales.map((s) => s.revenue));
    return max > 0 ? max * 1.15 : 100;
  }, [dailySales]);

  const totalPeriodRevenue = useMemo(() => {
    return dailySales.reduce((sum, d) => sum + d.revenue, 0);
  }, [dailySales]);

  const totalPeriodOrders = useMemo(() => {
    return dailySales.reduce((sum, d) => sum + d.orders_count, 0);
  }, [dailySales]);

  const avgTicket = totalPeriodOrders > 0 ? totalPeriodRevenue / totalPeriodOrders : 0;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; class: string }> = {
      pending: { label: "Pendiente", class: "bg-amber-950/80 text-amber-400 border-amber-800" },
      confirmed: { label: "Confirmado", class: "bg-blue-950/80 text-blue-400 border-blue-800" },
      preparing: { label: "Preparando", class: "bg-purple-950/80 text-purple-400 border-purple-800" },
      shipped: { label: "Enviado", class: "bg-teal-950/80 text-teal-400 border-teal-800" },
      delivered: { label: "Entregado", class: "bg-emerald-950/80 text-emerald-400 border-emerald-800" },
      cancelled: { label: "Cancelado", class: "bg-rose-950/80 text-rose-400 border-rose-800" },
    };
    const s = config[status] || { label: status, class: "bg-slate-800 text-slate-300 border-slate-700" };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.class}`}>
        {s.label}
      </span>
    );
  };

  if (isLoading && !summary) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse p-4" />
          ))}
        </div>
        <div className="h-80 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-bold">
            Panel de Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Resumen General del Negocio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Métricas operativas y de ventas sincronizadas en tiempo real con Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold active:scale-95 transition-all"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span>Actualizar datos</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("orders")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 active:scale-95 transition-all"
          >
            <ShoppingBag className="size-3.5" />
            <span>Gestionar pedidos</span>
          </button>
        </div>
      </div>

      {/* Actionable Alerts Banner List (if any alerts) */}
      {alerts.length > 0 && (
        <div className="space-y-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                alert.type === "urgent"
                  ? "bg-rose-950/30 border-rose-900/60 text-rose-200"
                  : alert.type === "warning"
                  ? "bg-amber-950/30 border-amber-900/60 text-amber-200"
                  : "bg-teal-950/30 border-teal-900/60 text-teal-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`size-5 shrink-0 mt-0.5 ${
                    alert.type === "urgent" ? "text-rose-400" : alert.type === "warning" ? "text-amber-400" : "text-teal-400"
                  }`}
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{alert.message}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab(alert.targetTab)}
                className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 text-xs font-bold text-white shrink-0 active:scale-95 transition-all"
              >
                <span>Resolver</span>
                <ArrowRight className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 8 Primary KPIs Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div
          onClick={() => onNavigateTab("orders")}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ventas Totales</span>
            <div className="size-8 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 grid place-items-center group-hover:scale-110 transition-transform">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            ${(summary?.total_revenue || 0).toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Excluye cancelados</span>
          </p>
        </div>

        {/* Total Orders */}
        <div
          onClick={() => onNavigateTab("orders")}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pedidos</span>
            <div className="size-8 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400 grid place-items-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {summary?.total_orders || 0}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Registrados en el sistema</p>
        </div>

        {/* Customers */}
        <div
          onClick={() => onNavigateTab("customers")}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Clientes</span>
            <div className="size-8 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-400 grid place-items-center group-hover:scale-110 transition-transform">
              <Users className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {summary?.total_customers || 0}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Perfiles en public.profiles</p>
        </div>

        {/* Active Products */}
        <div
          onClick={() => onNavigateTab("products")}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Productos Activos</span>
            <div className="size-8 rounded-xl bg-teal-950/60 border border-teal-800/60 text-teal-400 grid place-items-center group-hover:scale-110 transition-transform">
              <Package className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {summary?.active_products || 0}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">is_active = true</p>
        </div>

        {/* Pending Orders */}
        <div
          onClick={() => onNavigateTab("orders", "pending")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg group ${
            (summary?.pending_orders || 0) > 0
              ? "bg-amber-950/20 border-amber-900/50 hover:border-amber-500/60"
              : "bg-slate-900/80 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pendientes</span>
            <div className="size-8 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 grid place-items-center group-hover:scale-110 transition-transform">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400">
            {summary?.pending_orders || 0}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Requieren confirmación</p>
        </div>

        {/* Low Stock Products */}
        <div
          onClick={() => onNavigateTab("inventory")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg group ${
            (summary?.low_stock_products || 0) > 0
              ? "bg-rose-950/20 border-rose-900/50 hover:border-rose-500/60"
              : "bg-slate-900/80 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stock Bajo</span>
            <div className="size-8 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400 grid place-items-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-400">
            {summary?.low_stock_products || 0}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Stock ≤ 5 unidades</p>
        </div>

        {/* Unread Messages */}
        <div
          onClick={() => onNavigateTab("messages")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg group ${
            (summary?.unread_messages || 0) > 0
              ? "bg-sky-950/20 border-sky-900/50 hover:border-sky-500/60"
              : "bg-slate-900/80 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mensajes Nuevos</span>
            <div className="size-8 rounded-xl bg-sky-950/60 border border-sky-800/60 text-sky-400 grid place-items-center group-hover:scale-110 transition-transform">
              <MessageSquare className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-sky-400">
            {summary?.unread_messages || 0}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">status = new</p>
        </div>

        {/* Active Subscribers */}
        <div
          onClick={() => onNavigateTab("newsletter")}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Suscriptores</span>
            <div className="size-8 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 grid place-items-center group-hover:scale-110 transition-transform">
              <Mail className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {summary?.active_subscribers || 0}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Boletín activo</p>
        </div>
      </div>

      {/* Interactive Sales Chart */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Evolución</span>
              <span className="text-slate-500 text-xs">&bull;</span>
              <span className="text-xs text-slate-400">Ingresos vs. Pedidos</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
              Rendimiento Comercial
            </h3>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 self-start sm:self-auto">
            {(["7", "30", "90", "365"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setChartPeriod(period)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  chartPeriod === period
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {period === "7" ? "7 días" : period === "30" ? "30 días" : period === "90" ? "90 días" : "12 meses"}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-5 pb-6">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Ingresos del período</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              ${totalPeriodRevenue.toFixed(2)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Pedidos completados</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {totalPeriodOrders}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Ticket promedio</span>
            <p className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5">
              ${avgTicket.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Visual Chart Canvas / SVG */}
        <div className="h-56 w-full pt-4 relative">
          {dailySales.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-800/20 border border-slate-800">
              <Calendar className="size-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">
                No hay historial de ventas en este período
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Las transacciones de la tienda se registrarán automáticamente aquí.
              </p>
            </div>
          ) : (
            <div className="h-full flex items-end gap-1.5 sm:gap-2 pt-6">
              {dailySales.map((d, idx) => {
                const heightPercent = Math.min(100, Math.max(8, (d.revenue / maxRevenue) * 100));
                const dateLabel = new Date(d.sale_date).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-slate-800 border border-slate-700 p-2 rounded-xl text-center shadow-2xl z-20 whitespace-nowrap">
                      <p className="text-[10px] font-bold text-emerald-400">${d.revenue.toFixed(2)}</p>
                      <p className="text-[9px] text-slate-400">{d.orders_count} pedidos &bull; {d.sale_date}</p>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-emerald-600/40 to-emerald-400 hover:to-emerald-300 transition-all cursor-pointer shadow-xs"
                    />

                    {/* X axis date (only show intermittently) */}
                    {(dailySales.length <= 10 || idx % Math.ceil(dailySales.length / 8) === 0) && (
                      <span className="text-[9px] font-mono text-slate-500 mt-2 truncate max-w-full">
                        {dateLabel}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders (col 7) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Pedidos Recientes</h3>
              <p className="text-xs text-slate-400 mt-0.5">Últimas transacciones recibidas</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("orders")}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No hay pedidos registrados todavía en Supabase.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800/80 pb-2">
                    <th className="pb-3 font-semibold">ID</th>
                    <th className="pb-3 font-semibold">Cliente</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3 font-semibold">Estado</th>
                    <th className="pb-3 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-300">#{o.id}</td>
                      <td className="py-3">
                        <p className="font-semibold text-white truncate max-w-[140px]">{o.customer_name}</p>
                        <p className="text-[10px] text-slate-500">{new Date(o.created_at || "").toLocaleDateString()}</p>
                      </td>
                      <td className="py-3 font-bold text-emerald-400">${Number(o.total).toFixed(2)}</td>
                      <td className="py-3">{getStatusBadge(o.status)}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenOrderModal(o.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition-colors"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Selling Products (col 5) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Top Productos</h3>
              <p className="text-xs text-slate-400 mt-0.5">Más vendidos por volumen</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("products")}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Inventario</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Aún no hay ventas acumuladas para listar el top de productos.
              </div>
            ) : (
              topProducts.map((p, rank) => (
                <div
                  key={p.product_id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 transition-colors border border-slate-800/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="size-6 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs font-bold grid place-items-center shrink-0">
                      {rank + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{p.product_name}</p>
                      <p className="text-[10px] text-slate-400">{p.units_sold} unidades vendidas</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-400 shrink-0">
                    ${Number(p.revenue).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
