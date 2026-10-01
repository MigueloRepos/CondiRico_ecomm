import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  FileText,
  Plus,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { CustomerWithStats } from "@/types/admin";
import {
  getAdminCustomers,
  getCustomerDetails,
  addCustomerNote,
  CustomerFullDetail,
} from "@/services/admin/customers";
import { Button } from "@/components/ui/button";

export const AdminCustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerFullDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // New Note
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminCustomers(searchQuery);
      setCustomers(data);
    } catch (err) {
      console.error("Error loading customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const detail = await getCustomerDetails(selectedCustomerId);
        setCustomerDetail(detail);
      } catch (err) {
        console.error("Error loading customer detail:", err);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedCustomerId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await addCustomerNote(selectedCustomerId, newNote.trim());
      if (res.success && res.noteRecord) {
        showToast("Nota interna registrada con éxito.");
        setNewNote("");
        // Reload detail
        const updated = await getCustomerDetails(selectedCustomerId);
        setCustomerDetail(updated);
      } else {
        showToast(res.error || "No se pudo guardar la nota.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado.";
      showToast(msg);
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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
              Clientes
            </span>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono">
              {customers.length} perfiles registrados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Users className="size-7 text-emerald-400" />
            Gestión de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Visualiza perfiles, historial de compras y notas de seguimiento interno.
          </p>
        </div>

        <Button
          onClick={loadCustomers}
          variant="outline"
          className="h-10 px-3 rounded-xl border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white self-start sm:self-auto"
        >
          <RefreshCw className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar clientes por nombre, teléfono o ciudad..."
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

      {/* Customers Table */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">Cliente</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4">Ciudad</th>
                <th className="py-3.5 px-4">Fecha Registro</th>
                <th className="py-3.5 px-4 text-center">Pedidos</th>
                <th className="py-3.5 px-4 text-right">Total Gastado</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="size-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Cargando clientes de Supabase...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="size-8 mx-auto text-slate-600 mb-2" />
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-emerald-950/80 border border-emerald-800/80 grid place-items-center text-emerald-400 font-bold text-xs uppercase shrink-0">
                          {c.full_name ? c.full_name.substring(0, 2) : "CL"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {c.full_name || "Cliente sin nombre"}
                            </span>
                            {c.role === "admin" && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800/80 text-amber-400">
                                admin
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 block truncate max-w-[150px]">
                            ID: {c.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-400 text-xs">
                      <div>{c.phone || "Sin teléfono"}</div>
                    </td>

                    <td className="py-4 px-4 text-slate-400 text-xs">
                      {c.city || "—"}
                    </td>

                    <td className="py-4 px-4 text-slate-400 text-xs">
                      {new Date(c.created_at || "").toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-950 border border-slate-800 text-slate-300">
                        <ShoppingBag className="size-3 text-emerald-400" />
                        {c.orders_count || 0}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400">
                      ${Number(c.total_spent || 0).toFixed(2)}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(c.id);
                        }}
                        className="h-8 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <Eye className="size-4 mr-1 text-emerald-400" />
                        Ver Ficha
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail & Notes Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 grid place-items-center text-emerald-400">
                  <Users className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {customerDetail?.customer.full_name || "Ficha del Cliente"}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    ID: {selectedCustomerId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
              {isLoadingDetail || !customerDetail ? (
                <div className="py-16 text-center text-slate-500">
                  <RefreshCw className="size-8 animate-spin mx-auto text-emerald-500 mb-2" />
                  Cargando información del cliente...
                </div>
              ) : (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Total Gastado</span>
                      <strong className="text-base sm:text-lg font-mono font-bold text-emerald-400">
                        ${customerDetail.customer.total_spent.toFixed(2)}
                      </strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Pedidos Realizados</span>
                      <strong className="text-base sm:text-lg font-mono font-bold text-white">
                        {customerDetail.customer.orders_count}
                      </strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[11px] text-slate-400 block">Rol en Sistema</span>
                      <strong className="text-xs sm:text-sm font-mono font-bold text-sky-400 uppercase">
                        {customerDetail.customer.role || "customer"}
                      </strong>
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/50 space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Información de Contacto
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Teléfono:</span>
                        <span className="text-white font-medium">
                          {customerDetail.customer.phone || "No especificado"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Ciudad:</span>
                        <span className="text-white font-medium">
                          {customerDetail.customer.city || "No especificada"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Dirección:</span>
                        <span className="text-white font-medium">
                          {customerDetail.customer.address || "No especificada"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Registrado el:</span>
                        <span className="text-white font-medium">
                          {new Date(customerDetail.customer.created_at || "").toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Internal Notes Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="size-4 text-emerald-400" />
                        Notas Internas del Equipo ({customerDetail.notes.length})
                      </span>
                    </div>

                    <form onSubmit={handleAddNote} className="space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Escribe una nota privada sobre este cliente (preferencias, incidencias, acuerdos)..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 resize-none focus:outline-hidden focus:border-emerald-500"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={isAddingNote || !newNote.trim()}
                          size="sm"
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4"
                        >
                          {isAddingNote ? "Guardando..." : "Agregar Nota"}
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {customerDetail.notes.length === 0 ? (
                        <p className="text-slate-500 text-xs italic">
                          No hay notas internas registradas para este cliente.
                        </p>
                      ) : (
                        customerDetail.notes.map((n) => (
                          <div
                            key={n.id}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                          >
                            <p className="text-slate-200">{n.note}</p>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {new Date(n.created_at).toLocaleString("es-ES")}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Orders History */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Historial de Pedidos ({customerDetail.orders.length})
                    </span>
                    <div className="rounded-2xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                            <th className="py-2.5 px-3"># Pedido</th>
                            <th className="py-2.5 px-3">Fecha</th>
                            <th className="py-2.5 px-3">Estado</th>
                            <th className="py-2.5 px-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                          {customerDetail.orders.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-slate-500">
                                Sin pedidos registrados.
                              </td>
                            </tr>
                          ) : (
                            customerDetail.orders.map((o) => (
                              <tr key={o.id}>
                                <td className="py-2 px-3 font-mono font-bold text-white">
                                  #{o.id}
                                </td>
                                <td className="py-2 px-3 text-slate-400">
                                  {new Date(o.created_at || "").toLocaleDateString("es-ES")}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 border border-slate-800 text-slate-300">
                                    {o.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                  ${Number(o.total).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <Button
                onClick={() => setSelectedCustomerId(null)}
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
