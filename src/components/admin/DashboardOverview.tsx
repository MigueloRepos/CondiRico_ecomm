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
  PlusCircle,
  FolderPlus,
  Crown,
  UserCheck,
  Award,
  DollarSign,
  Tag,
  Boxes,
  AlertOctagon,
  ArrowDownRight,
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
  getRecentUsers,
  getTopCustomers,
  getLowStockProducts,
  DashboardAlert,
  RecentUser,
  TopCustomer,
  LowStockProduct,
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
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
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
        lowStockProds,
        ordersRes,
        alertsData,
        recUsers,
        topCusts,
      ] = await Promise.all([
        getAdminSummary(),
        getDailySales(days),
        getTopProducts(5),
        getLowStockProducts(5),
        getAdminOrders({ pageSize: 5 }),
        getDashboardAlerts(),
        getRecentUsers(5),
        getTopCustomers(5),
      ]);

      setSummary(sumData);
      setDailySales(salesData);
      setTopProducts(topProds);
      setLowStockProducts(lowStockProds);
      setRecentOrders(ordersRes.orders);
      setAlerts(alertsData);
      setRecentUsers(recUsers);
      setTopCustomers(topCusts);
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

  // Chart calculations
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

  const avgTicket = useMemo(() => {
    if (totalPeriodOrders === 0) return 0;
    return totalPeriodRevenue / totalPeriodOrders;
  }, [totalPeriodRevenue, totalPeriodOrders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <CheckCircle2 className="size-2.5" /> Entregado
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            <Clock className="size-2.5" /> Pendiente
          </span>
        );
      case "processing":
      case "confirmed":
      case "preparing":
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-950/60 border border-blue-800/80 px-2 py-0.5 text-[10px] font-bold text-blue-400">
            En camino
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/60 border border-rose-800/80 px-2 py-0.5 text-[10px] font-bold text-rose-400">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
              <Sparkles className="size-3" /> Panel Administrativo
            </span>
            <span className="text-xs text-slate-400 font-mono">
              CondiRico Cloud Supabase
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
            Resumen General y Control Operativo
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas de ventas, inventario, categorías y usuarios en tiempo real.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab("products", "new")}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/50 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="size-4" />
            <span>Publicar Producto</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("categories")}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <FolderPlus className="size-4 text-amber-400" />
            <span>Añadir Categoría</span>
          </button>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 active:scale-95 transition-all cursor-pointer"
            title="Recargar métricas"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Operational Alerts if any */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => onNavigateTab(alert.targetTab)}
              className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 ${
                alert.type === "urgent"
                  ? "bg-rose-950/30 border-rose-800/60 text-rose-200 hover:bg-rose-950/50"
                  : alert.type === "warning"
                  ? "bg-amber-950/30 border-amber-800/60 text-amber-200 hover:bg-amber-950/50"
                  : "bg-sky-950/30 border-sky-800/60 text-sky-200 hover:bg-sky-950/50"
              }`}
            >
              <AlertTriangle className="size-5 shrink-0 mt-0.5 text-current" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">{alert.title}</h4>
                <p className="text-[11px] text-slate-300/80 mt-0.5 line-clamp-2">{alert.message}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-slate-400 self-center" />
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div
          onClick={() => onNavigateTab("orders")}
          className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all hover:shadow-xl group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Ventas</span>
            <div className="size-9 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 grid place-items-center group-hover:scale-110 transition-transform">
              <DollarSign className="size-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ${summary?.total_revenue?.toFixed(2) || "0.00"}
          </p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="size-3" /> Transacciones en Supabase
          </p>
        </div>

        {/* Total Orders */}
        <div
          onClick={() => onNavigateTab("orders")}
          className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 cursor-pointer transition-all hover:shadow-xl group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pedidos Totales</span>
            <div className="size-9 rounded-2xl bg-blue-950/60 border border-blue-800/60 text-blue-400 grid place-items-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="size-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {summary?.total_orders || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary?.pending_orders || 0} pendientes de despacho
          </p>
        </div>

        {/* Total Customers */}
        <div
          onClick={() => onNavigateTab("customers")}
          className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all hover:shadow-xl group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Usuarios / Clientes</span>
            <div className="size-9 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 grid place-items-center group-hover:scale-110 transition-transform">
              <Users className="size-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {summary?.total_customers || 0}
          </p>
          <p className="text-[11px] text-indigo-400 font-semibold mt-1">
            Perfiles registrados en DB
          </p>
        </div>

        {/* Active Products */}
        <div
          onClick={() => onNavigateTab("products")}
          className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all hover:shadow-xl group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Catálogo Activo</span>
            <div className="size-9 rounded-2xl bg-amber-950/60 border border-amber-800/60 text-amber-400 grid place-items-center group-hover:scale-110 transition-transform">
              <Package className="size-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {summary?.active_products || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary?.low_stock_products || 0} con stock bajo
          </p>
        </div>
      </div>

      {/* Interactive Sales Chart */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Estadísticas</span>
              <span className="text-slate-500 text-xs">&bull;</span>
              <span className="text-xs text-slate-400">Rendimiento Comercial y Ventas</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
              Evolución de Ventas e Ingresos
            </h3>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 self-start sm:self-auto">
            {(["7", "30", "90", "365"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setChartPeriod(period)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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

        {/* Visual Chart Canvas */}
        <div className="h-56 w-full pt-4 relative">
          {dailySales.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-800/20 border border-slate-800">
              <Calendar className="size-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">
                No hay ventas registradas en este período
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Las transacciones generadas en la tienda aparecerán aquí automáticamente.
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

                    {/* X axis date */}
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

      {/* Grid: 5 Top Selling Products & 5 Lowest Stock Products (Identificar Reabastecimiento) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Table 1: 5 Productos Más Vendidos */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 grid place-items-center">
                  <Award className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">5 Productos Más Vendidos</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Artículos líderes en rotación y ventas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("products")}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Catálogo</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              {topProducts.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Aún no hay ventas acumuladas registradas en Supabase.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/80 pb-2">
                      <th className="pb-2.5 font-semibold">#</th>
                      <th className="pb-2.5 font-semibold">Producto</th>
                      <th className="pb-2.5 font-semibold text-center">Unidades</th>
                      <th className="pb-2.5 font-semibold text-right">Recaudación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {topProducts.map((p, rank) => (
                      <tr key={p.product_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-400 w-8">
                          <span className={`size-5 rounded-md text-[11px] grid place-items-center ${
                            rank === 0
                              ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                              : rank === 1
                              ? "bg-slate-300 text-slate-950 font-bold"
                              : rank === 2
                              ? "bg-amber-700 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {rank + 1}
                          </span>
                        </td>
                        <td className="py-3 pr-2">
                          <p className="font-semibold text-white truncate max-w-[170px]">{p.product_name}</p>
                        </td>
                        <td className="py-3 text-center font-bold text-slate-200">
                          {p.units_sold} <span className="text-[10px] text-slate-500 font-normal">u.</span>
                        </td>
                        <td className="py-3 text-right font-black text-emerald-400">
                          ${Number(p.revenue).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Table 2: 5 Productos con Menos Stock (Reabastecimiento) */}
        <div className="lg:col-span-6 rounded-3xl border border-rose-950/40 bg-slate-900/90 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 grid place-items-center">
                  <AlertOctagon className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">5 Productos con Menor Stock</h3>
                  <p className="text-xs text-rose-400/90 mt-0.5 font-medium">Reabastecimiento prioritario</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("inventory")}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Gestionar Stock</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              {lowStockProducts.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Todo el inventario se encuentra actualmente en niveles óptimos.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/80 pb-2">
                      <th className="pb-2.5 font-semibold">Producto</th>
                      <th className="pb-2.5 font-semibold">Categoría</th>
                      <th className="pb-2.5 font-semibold text-center">Stock</th>
                      <th className="pb-2.5 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {lowStockProducts.map((p) => {
                      const isCritical = p.stock <= 5;
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 pr-2">
                            <p className="font-semibold text-white truncate max-w-[160px]">{p.name}</p>
                            <p className="text-[10px] text-slate-400">${p.price.toFixed(2)} / {p.unit || "unidad"}</p>
                          </td>
                          <td className="py-3 text-slate-400 text-[11px] truncate max-w-[100px]">
                            {p.category_name}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                              isCritical
                                ? "bg-rose-950/80 text-rose-300 border border-rose-800 animate-pulse"
                                : "bg-amber-950/80 text-amber-300 border border-amber-800"
                            }`}>
                              <AlertTriangle className="size-3" />
                              {p.stock}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => onNavigateTab("inventory", p.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-[11px] font-bold text-rose-200 transition-all cursor-pointer"
                            >
                              Reabastecer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Top Buying Customers & Recently Registered Users */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Top Purchasing Customers (Usuarios que más compran) */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 grid place-items-center">
                  <Crown className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Usuarios que Más Compran</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Top clientes por volumen de compras</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("customers")}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todos</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {topCustomers.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Aún no hay compras registradas para calcular el top de clientes.
                </div>
              ) : (
                topCustomers.map((c, rank) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 transition-colors border border-slate-800/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`size-6 rounded-lg font-mono text-xs font-bold grid place-items-center shrink-0 ${
                        rank === 0
                          ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                          : rank === 1
                          ? "bg-slate-300 text-slate-950 font-black"
                          : rank === 2
                          ? "bg-amber-700 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {rank + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {c.email || "Sin email"} &bull; {c.orders_count} {c.orders_count === 1 ? "pedido" : "pedidos"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-400 block">
                        ${c.total_spent.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500">gastados</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recently Registered Users (Control de usuarios registrados recientemente) */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 grid place-items-center">
                <UserCheck className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Usuarios Recientes</h3>
                <p className="text-xs text-slate-400 mt-0.5">Últimos registros en la plataforma</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("customers")}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver clientes</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {recentUsers.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No hay usuarios registrados recientemente en Supabase.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800/80 pb-2">
                    <th className="pb-2.5 font-semibold">Usuario</th>
                    <th className="pb-2.5 font-semibold">Rol</th>
                    <th className="pb-2.5 font-semibold text-right">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3">
                        <p className="font-semibold text-white truncate max-w-[170px]">{u.full_name}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[170px]">{u.email}</p>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === "admin"
                            ? "bg-amber-950/60 border border-amber-800 text-amber-300"
                            : "bg-slate-800 border border-slate-700 text-slate-300"
                        }`}>
                          {u.role === "admin" ? "Administrador" : "Cliente"}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[11px] text-slate-400 font-mono">
                        {new Date(u.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Pedidos Recientes</h3>
            <p className="text-xs text-slate-400 mt-0.5">Últimas transacciones recibidas</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("orders")}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todos los pedidos</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No hay pedidos registrados todavía en Supabase.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/80 pb-2">
                  <th className="pb-2.5 font-semibold">ID</th>
                  <th className="pb-2.5 font-semibold">Cliente</th>
                  <th className="pb-2.5 font-semibold">Total</th>
                  <th className="pb-2.5 font-semibold">Estado</th>
                  <th className="pb-2.5 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-300">#{o.id}</td>
                    <td className="py-3">
                      <p className="font-semibold text-white truncate max-w-[130px]">{o.customer_name}</p>
                      <p className="text-[10px] text-slate-500">{new Date(o.created_at || "").toLocaleDateString()}</p>
                    </td>
                    <td className="py-3 font-bold text-emerald-400">${Number(o.total).toFixed(2)}</td>
                    <td className="py-3">{getStatusBadge(o.status)}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenOrderModal(o.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition-colors cursor-pointer"
                      >
                        Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
