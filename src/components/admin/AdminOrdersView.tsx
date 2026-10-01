import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  CreditCard,
  FileText,
  User,
} from "lucide-react";
import { Order } from "@/types/database";
import {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  OrderWithItems,
} from "@/services/admin/orders";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/ToastContext";

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pendiente",
    color: "text-amber-400",
    bg: "bg-amber-950/60",
    border: "border-amber-800/60",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmado",
    color: "text-sky-400",
    bg: "bg-sky-950/60",
    border: "border-sky-800/60",
    icon: CheckCircle2,
  },
  preparing: {
    label: "Preparando",
    color: "text-indigo-400",
    bg: "bg-indigo-950/60",
    border: "border-indigo-800/60",
    icon: PackageCheck,
  },
  shipped: {
    label: "Enviado",
    color: "text-purple-400",
    bg: "bg-purple-950/60",
    border: "border-purple-800/60",
    icon: Truck,
  },
  delivered: {
    label: "Entregado",
    color: "text-emerald-400",
    bg: "bg-emerald-950/60",
    border: "border-emerald-800/60",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelado",
    color: "text-rose-400",
    bg: "bg-rose-950/60",
    border: "border-rose-800/60",
    icon: XCircle,
  },
};

interface AdminOrdersViewProps {
  initialOrderId?: number | null;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({ initialOrderId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Selected Order Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(initialOrderId || null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderWithItems | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [newStatusSelect, setNewStatusSelect] = useState("");
  const [statusChangeNote, setStatusChangeNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminOrders({
        status: statusFilter,
        search: searchQuery,
        page,
        pageSize,
      });
      setOrders(res.orders);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, page]);

  // Handle search debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadOrders();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load order detail when selected
  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrderDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const detail = await getAdminOrderById(selectedOrderId);
        setSelectedOrderDetail(detail);
        if (detail) {
          setNewStatusSelect(detail.status);
        }
      } catch (err) {
        console.error("Error fetching order detail:", err);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedOrderId]);

  const { showDeliveryStatusToast, showSuccessToast, showErrorToast } = useToast();

  const handleUpdateStatus = async () => {
    if (!selectedOrderDetail || !newStatusSelect) return;
    if (newStatusSelect === selectedOrderDetail.status && !statusChangeNote.trim()) {
      showSuccessToast("El pedido ya está en este estado.");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await updateOrderStatus(
        selectedOrderDetail.id,
        newStatusSelect,
        statusChangeNote.trim() || undefined
      );

      if (res.success) {
        showDeliveryStatusToast(selectedOrderDetail.id, newStatusSelect);
        setStatusChangeNote("");
        // Reload detail
        const updated = await getAdminOrderById(selectedOrderDetail.id);
        setSelectedOrderDetail(updated);
        // Refresh orders list
        loadOrders();
      } else {
        showErrorToast("Error", res.error || "No se pudo actualizar el pedido.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar estado.";
      showErrorToast("Error", msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-600 text-white px-5 py-3 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-5 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
              Ventas
            </span>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono">
              {totalCount} pedidos registrados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <ShoppingBag className="size-7 text-emerald-400" />
            Gestión de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Revisa, actualiza estados y despacha los pedidos de tus clientes en tiempo real.
          </p>
        </div>

        <Button
          onClick={loadOrders}
          variant="outline"
          className="h-10 px-3 rounded-xl border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white self-start sm:self-auto"
        >
          <RefreshCw className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "Todos" },
            { id: "pending", label: "Pendientes" },
            { id: "confirmed", label: "Confirmados" },
            { id: "preparing", label: "Preparando" },
            { id: "shipped", label: "Enviados" },
            { id: "delivered", label: "Entregados" },
            { id: "cancelled", label: "Cancelados" },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/40"
                    : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por # de pedido, nombre de cliente, teléfono o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6"># Pedido</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Subtotal / Envío</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Método Pago</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="size-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Cargando pedidos de Supabase...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <ShoppingBag className="size-8 mx-auto text-slate-600 mb-2" />
                    No se encontraron pedidos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const cfg = ORDER_STATUS_CONFIG[order.status] || {
                    label: order.status,
                    color: "text-slate-400",
                    bg: "bg-slate-900",
                    border: "border-slate-800",
                    icon: AlertCircle,
                  };
                  const StatusIcon = cfg.icon;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <td className="py-4 px-4 sm:px-6 font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                        #{order.id}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{order.customer_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {order.customer_phone || order.customer_email || "Sin contacto"}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-400 text-xs">
                        {new Date(order.created_at || "").toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-4 px-4 text-slate-400 text-xs">
                        <div>Sub: ${Number(order.subtotal || 0).toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500">
                          Envío: ${Number(order.shipping_cost || 0).toFixed(2)}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono font-extrabold text-emerald-400 text-sm">
                        ${Number(order.total).toFixed(2)}
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-950 border border-slate-800 text-slate-300">
                          {order.payment_method || "WhatsApp / Efectivo"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.border} ${cfg.color}`}
                        >
                          <StatusIcon className="size-3" />
                          {cfg.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(order.id);
                          }}
                          className="h-8 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Eye className="size-4 mr-1 text-emerald-400" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
            <span>
              Página {page} de {totalPages} ({totalCount} pedidos)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 rounded-lg border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5 rounded-lg border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detalle de Pedido */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            {/* Header modal */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 grid place-items-center text-emerald-400">
                  <ShoppingBag className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Pedido #{selectedOrderId}
                    </h3>
                    {selectedOrderDetail && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          ORDER_STATUS_CONFIG[selectedOrderDetail.status]?.bg
                        } ${ORDER_STATUS_CONFIG[selectedOrderDetail.status]?.border} ${
                          ORDER_STATUS_CONFIG[selectedOrderDetail.status]?.color
                        }`}
                      >
                        {ORDER_STATUS_CONFIG[selectedOrderDetail.status]?.label ||
                          selectedOrderDetail.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedOrderDetail
                      ? new Date(selectedOrderDetail.created_at || "").toLocaleString("es-ES")
                      : "Cargando..."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderId(null)}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content modal */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
              {isLoadingDetail || !selectedOrderDetail ? (
                <div className="py-16 text-center text-slate-500">
                  <RefreshCw className="size-8 animate-spin mx-auto text-emerald-500 mb-2" />
                  Cargando detalle del pedido...
                </div>
              ) : (
                <>
                  {/* Status Change Control */}
                  <div className="p-4 rounded-2xl border border-emerald-900/60 bg-emerald-950/20 space-y-3">
                    <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">
                      Gestionar Estado del Pedido
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <select
                        value={newStatusSelect}
                        onChange={(e) => setNewStatusSelect(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold text-xs focus:outline-hidden focus:border-emerald-500"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="preparing">Preparando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Nota de cambio (opcional)..."
                        value={statusChangeNote}
                        onChange={(e) => setStatusChangeNote(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 sm:col-span-1"
                      />

                      <Button
                        onClick={handleUpdateStatus}
                        disabled={isUpdatingStatus}
                        className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40"
                      >
                        {isUpdatingStatus ? "Actualizando..." : "Aplicar Cambio"}
                      </Button>
                    </div>
                  </div>

                  {/* Customer & Delivery Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Info */}
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-3">
                      <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
                        <User className="size-4 text-emerald-400" />
                        Datos del Cliente
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <p className="text-white font-bold text-sm">
                          {selectedOrderDetail.customer_name}
                        </p>
                        {selectedOrderDetail.customer_email && (
                          <p className="text-slate-400 flex items-center gap-1.5">
                            <Mail className="size-3.5 text-slate-500" />
                            {selectedOrderDetail.customer_email}
                          </p>
                        )}
                        {selectedOrderDetail.customer_phone && (
                          <p className="text-slate-400 flex items-center gap-1.5">
                            <Phone className="size-3.5 text-slate-500" />
                            {selectedOrderDetail.customer_phone}
                          </p>
                        )}
                        {selectedOrderDetail.shipping_city && (
                          <p className="text-slate-400 flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-slate-500" />
                            Ciudad: {selectedOrderDetail.shipping_city}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delivery & Payment Info */}
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-3">
                      <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
                        <Truck className="size-4 text-emerald-400" />
                        Envío y Pago
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <p className="text-slate-300">
                          <strong className="text-slate-400">Dirección:</strong>{" "}
                          {selectedOrderDetail.shipping_address || "No especificada"}
                        </p>
                        <p className="text-slate-300">
                          <strong className="text-slate-400">Método de pago:</strong>{" "}
                          {selectedOrderDetail.payment_method || "WhatsApp"}
                        </p>
                        {selectedOrderDetail.delivery_instructions && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                            <span className="font-bold text-amber-400 block mb-0.5">
                              Instrucciones:
                            </span>
                            {selectedOrderDetail.delivery_instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Productos del Pedido ({selectedOrderDetail.items?.length || 0})
                    </span>

                    <div className="rounded-2xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                            <th className="py-2.5 px-3">Producto</th>
                            <th className="py-2.5 px-3 text-center">Cant.</th>
                            <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                            <th className="py-2.5 px-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                          {selectedOrderDetail.items && selectedOrderDetail.items.length > 0 ? (
                            selectedOrderDetail.items.map((it) => (
                              <tr key={it.id}>
                                <td className="py-2.5 px-3 text-white font-medium">
                                  {it.product_name}
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                                  {it.quantity}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                                  ${Number(it.unit_price).toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                                  ${Number(it.quantity * it.unit_price).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-slate-500">
                                Sin líneas de productos detalladas.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals Summary */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-mono">${Number(selectedOrderDetail.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Costo de envío</span>
                      <span className="font-mono">${Number(selectedOrderDetail.shipping_cost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                      <span>Total</span>
                      <span className="font-mono text-emerald-400 text-base">
                        ${Number(selectedOrderDetail.total).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Status History */}
                  {selectedOrderDetail.history && selectedOrderDetail.history.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Historial de Estados (Auditoría)
                      </span>
                      <div className="space-y-2">
                        {selectedOrderDetail.history.map((h) => (
                          <div
                            key={h.id}
                            className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs flex items-start justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-400">
                                  {h.previous_status || "inicio"} →{" "}
                                  <strong className="text-white">{h.new_status}</strong>
                                </span>
                                {h.changed_by && (
                                  <span className="text-[10px] text-slate-500">
                                    por {h.changed_by}
                                  </span>
                                )}
                              </div>
                              {h.note && <p className="text-slate-400 text-[11px] mt-0.5">{h.note}</p>}
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                              {new Date(h.created_at).toLocaleString("es-ES")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer modal */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <Button
                onClick={() => setSelectedOrderId(null)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-6"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
