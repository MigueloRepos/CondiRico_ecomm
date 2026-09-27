import React, { useState, useEffect } from "react";
import {
  Mail,
  Search,
  Download,
  Trash2,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
} from "lucide-react";
import { NewsletterSubscriber } from "@/types/database";
import {
  getAdminSubscribers,
  toggleSubscriberStatus,
  deleteSubscriber,
} from "@/services/admin/newsletter";
import { Button } from "@/components/ui/button";

export const AdminNewsletterView: React.FC = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);

  const [subscriberToDelete, setSubscriberToDelete] = useState<NewsletterSubscriber | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminSubscribers(searchQuery);
      setSubscribers(data);
    } catch (err) {
      console.error("Error loading subscribers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleToggleStatus = async (sub: NewsletterSubscriber) => {
    try {
      const res = await toggleSubscriberStatus(sub.id, sub.is_active);
      if (res.success) {
        setSubscribers((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, is_active: !s.is_active } : s))
        );
        showToast(`Suscriptor ${sub.email} ahora está ${!sub.is_active ? "Activo" : "Inactivo"}.`);
      }
    } catch {
      showToast("Error al cambiar estado.");
    }
  };

  const handleDelete = async () => {
    if (!subscriberToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteSubscriber(subscriberToDelete.id);
      if (res.success) {
        showToast(`Suscriptor ${subscriberToDelete.email} eliminado.`);
        setSubscriberToDelete(null);
        loadData();
      } else {
        alert(res.error || "No se pudo eliminar.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar.";
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      alert("No hay suscriptores para exportar.");
      return;
    }

    const headers = ["ID", "Email", "Fecha Suscripcion", "Estado"];
    const rows = filteredSubscribers.map((s) => [
      s.id,
      `"${s.email}"`,
      `"${new Date(s.created_at || "").toISOString()}"`,
      s.is_active ? "Activo" : "Inactivo",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `condirico_newsletter_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Archivo CSV descargado con éxito.");
  };

  const filteredSubscribers = subscribers.filter((s) => {
    if (statusFilter === "active" && !s.is_active) return false;
    if (statusFilter === "inactive" && s.is_active) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-600 text-white px-5 py-3 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <Check className="size-5 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
              Audiencia
            </span>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono">
              {subscribers.length} suscriptores registrados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Mail className="size-7 text-emerald-400" />
            Suscriptores al Newsletter
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestiona la lista de correo recopilada desde el formulario de novedades.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            className="h-10 px-3 rounded-xl border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            onClick={handleExportCSV}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por correo electrónico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Estado:</span>
          <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
            {(
              [
                { id: "all", label: "Todos" },
                { id: "active", label: "Activos" },
                { id: "inactive", label: "Inactivos" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                  statusFilter === f.id
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">Email del Suscriptor</th>
                <th className="py-3.5 px-4">Fecha de Registro</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <RefreshCw className="size-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Cargando suscriptores de Supabase...
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <Mail className="size-8 mx-auto text-slate-600 mb-2" />
                    No se encontraron suscriptores con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-slate-800 border border-slate-700 grid place-items-center text-emerald-400 shrink-0">
                          <Mail className="size-4" />
                        </div>
                        <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {sub.email}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-400 text-xs font-mono">
                      {new Date(sub.created_at || "").toLocaleString("es-ES")}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(sub)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          sub.is_active
                            ? "bg-emerald-950/70 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60"
                            : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            sub.is_active ? "bg-emerald-400" : "bg-slate-600"
                          }`}
                        />
                        {sub.is_active ? "Activo" : "Inactivo"}
                      </button>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => setSubscriberToDelete(sub)}
                        title="Eliminar suscriptor"
                        className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {subscriberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-900/60 bg-slate-900 p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="size-14 rounded-2xl bg-rose-950/80 border border-rose-800/80 grid place-items-center text-rose-400 mx-auto">
              <AlertTriangle className="size-7" />
            </div>
            <h3 className="text-lg font-bold text-white">
              ¿Eliminar suscriptor "{subscriberToDelete.email}"?
            </h3>
            <p className="text-xs text-slate-400">
              Se eliminará este registro permanentemente de la base de datos de newsletter.
            </p>
            <div className="flex items-center justify-center gap-3 pt-3">
              <Button
                onClick={() => setSubscriberToDelete(null)}
                variant="outline"
                className="rounded-xl border-slate-800 bg-slate-900 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-6"
              >
                {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
