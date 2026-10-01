import React, { useState, useEffect } from "react";
import {
  DollarSign,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  User,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { PaymentRecord, PaymentProvider, PaymentStatus } from "@/types/payment";
import {
  getPaymentsAuditList,
  getPaymentsSummaryMetrics,
  PaymentsSummaryMetrics,
} from "@/services/paymentService";

const PROVIDER_CONFIG: Record<
  PaymentProvider,
  { label: string; color: string; bg: string; border: string }
> = {
  paypal: {
    label: "PayPal",
    color: "text-blue-400",
    bg: "bg-blue-950/60",
    border: "border-blue-800/60",
  },
  stripe: {
    label: "Stripe (Tarjeta)",
    color: "text-emerald-400",
    bg: "bg-emerald-950/60",
    border: "border-emerald-800/60",
  },
  google_pay: {
    label: "Google Pay",
    color: "text-purple-400",
    bg: "bg-purple-950/60",
    border: "border-purple-800/60",
  },
};

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  paid: {
    label: "Pagado",
    color: "text-emerald-400",
    bg: "bg-emerald-950/60",
    border: "border-emerald-800/60",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pendiente",
    color: "text-amber-400",
    bg: "bg-amber-950/60",
    border: "border-amber-800/60",
    icon: Clock,
  },
  processing: {
    label: "Procesando",
    color: "text-sky-400",
    bg: "bg-sky-950/60",
    border: "border-sky-800/60",
    icon: Clock,
  },
  failed: {
    label: "Fallido",
    color: "text-rose-400",
    bg: "bg-rose-950/60",
    border: "border-rose-800/60",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelado",
    color: "text-slate-400",
    bg: "bg-slate-800",
    border: "border-slate-700",
    icon: XCircle,
  },
  refunded: {
    label: "Reembolsado",
    color: "text-purple-400",
    bg: "bg-purple-950/60",
    border: "border-purple-800/60",
    icon: RotateCcw,
  },
};

export const AdminPaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<
    (PaymentRecord & { customer_name?: string; customer_email?: string })[]
  >([]);
  const [metrics, setMetrics] = useState<PaymentsSummaryMetrics | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<
    (PaymentRecord & { customer_name?: string; customer_email?: string }) | null
  >(null);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [listRes, summaryRes] = await Promise.all([
        getPaymentsAuditList({
          provider: providerFilter,
          status: statusFilter,
          page,
          pageSize,
        }),
        getPaymentsSummaryMetrics(),
      ]);

      setPayments(listRes.payments);
      setTotalCount(listRes.totalCount);
      setMetrics(summaryRes);
    } catch (err) {
      console.error("[AdminPaymentsView] Error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [providerFilter, statusFilter, page]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
              <ShieldCheck className="size-3" /> Pasarelas & Auditoría
            </span>
            <span className="text-xs text-slate-400 font-mono">
              PayPal &bull; Stripe &bull; Google Pay
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
            Gestión de Pagos y Transacciones
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro de cobros verificados por servidor y webhooks en Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* KPI Metrics Grid (Section 21) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Processed */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Procesado</span>
            <div className="size-8 sm:size-9 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 grid place-items-center">
              <DollarSign className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ${metrics?.totalProcessed.toFixed(2) || "0.00"}
          </p>
          <p className="text-[10px] text-emerald-400 font-semibold mt-1">Cobros confirmados</p>
        </div>

        {/* PayPal Payments */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Pagos PayPal</span>
            <div className="size-8 sm:size-9 rounded-2xl bg-blue-950/60 border border-blue-800/60 text-blue-400 grid place-items-center font-black text-xs">
              PP
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ${metrics?.paypalRevenue.toFixed(2) || "0.00"}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">{metrics?.paypalCount || 0} transacciones</p>
        </div>

        {/* Stripe Payments */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Pagos Stripe</span>
            <div className="size-8 sm:size-9 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 grid place-items-center">
              <CreditCard className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ${metrics?.stripeRevenue.toFixed(2) || "0.00"}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">{metrics?.stripeCount || 0} tarjetas procesadas</p>
        </div>

        {/* Google Pay & Status Breakdown */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Google Pay & Otros</span>
            <div className="size-8 sm:size-9 rounded-2xl bg-purple-950/60 border border-purple-800/60 text-purple-400 grid place-items-center font-black text-xs">
              GPay
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ${metrics?.googlePayRevenue.toFixed(2) || "0.00"}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
            <span className="text-amber-400">{metrics?.pendingCount || 0} pend.</span>
            <span>&bull;</span>
            <span className="text-rose-400">{metrics?.failedCount || 0} fall.</span>
            <span>&bull;</span>
            <span className="text-purple-400">{metrics?.refundedCount || 0} reemb.</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-3xl border border-slate-800">
        {/* Provider filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Todos los Proveedores" },
            { id: "paypal", label: "PayPal" },
            { id: "stripe", label: "Stripe" },
            { id: "google_pay", label: "Google Pay" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setProviderFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                providerFilter === tab.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">Todos los estados</option>
            <option value="paid">Pagados</option>
            <option value="pending">Pendientes</option>
            <option value="failed">Fallidos</option>
            <option value="refunded">Reembolsados</option>
          </select>
        </div>
      </div>

      {/* Payments Audit Table (Section 21) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6"># Pedido</th>
                <th className="py-3.5 px-4">Proveedor</th>
                <th className="py-3.5 px-4">ID Transacción</th>
                <th className="py-3.5 px-4">Importe</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <RefreshCw className="size-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Cargando auditoría de pagos...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <ShieldCheck className="size-8 mx-auto text-slate-600 mb-2" />
                    No hay registros de pagos para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const provCfg = PROVIDER_CONFIG[p.provider] || {
                    label: p.provider,
                    color: "text-slate-300",
                    bg: "bg-slate-800",
                    border: "border-slate-700",
                  };
                  const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusCfg.icon;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-white">
                        #{p.order_id}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${provCfg.bg} ${provCfg.border} ${provCfg.color}`}
                        >
                          {provCfg.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 truncate max-w-[140px]">
                        {p.provider_payment_id || "---"}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-emerald-400 text-sm">
                        ${p.amount.toFixed(2)} {p.currency}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white truncate max-w-[130px]">
                          {p.customer_name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[130px]">
                          {p.customer_email || "Sin email"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}
                        >
                          <StatusIcon className="size-3" />
                          {statusCfg.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-400 font-mono">
                        {new Date(p.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(p)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Ver
                        </button>
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
            <span>
              Página {page} de {totalPages} ({totalCount} transacciones)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Auditoría de Pago #{selectedPayment.order_id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">ID de Registro:</span>
                <span className="font-mono text-white">{selectedPayment.id}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Proveedor:</span>
                <span className="font-bold text-emerald-400 uppercase">{selectedPayment.provider}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">ID Pasarela:</span>
                <span className="font-mono text-sky-400">{selectedPayment.provider_payment_id || "Sin ID"}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Monto Cobrado:</span>
                <span className="font-mono font-bold text-white">
                  ${selectedPayment.amount.toFixed(2)} {selectedPayment.currency}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Fecha de Pago:</span>
                <span>{selectedPayment.paid_at ? new Date(selectedPayment.paid_at).toLocaleString() : "No confirmado"}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Cliente:</span>
                <span className="text-white font-semibold">{selectedPayment.customer_name} ({selectedPayment.customer_email})</span>
              </div>
            </div>

            {selectedPayment.metadata && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                  Metadatos / Eventos de Pasarela
                </span>
                <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto max-h-32">
                  {JSON.stringify(selectedPayment.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
