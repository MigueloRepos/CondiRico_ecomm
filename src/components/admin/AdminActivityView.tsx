import React, { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
import { AdminActivityLog } from "@/types/admin";
import { getActivityLog } from "@/services/admin/activity";
import { Button } from "@/components/ui/button";

export const AdminActivityView: React.FC = () => {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getActivityLog(100);
      setLogs(data);
    } catch (err) {
      console.error("Error loading activity log:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getEntityIcon = (entity?: string | null) => {
    switch (entity) {
      case "products":
        return <Package className="size-4 text-emerald-400" />;
      case "categories":
        return <Layers className="size-4 text-sky-400" />;
      case "orders":
        return <ShoppingBag className="size-4 text-indigo-400" />;
      case "promotions":
        return <Tag className="size-4 text-amber-400" />;
      case "banners":
        return <ImageIcon className="size-4 text-purple-400" />;
      case "settings":
        return <Settings className="size-4 text-teal-400" />;
      default:
        return <Activity className="size-4 text-slate-400" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (entityFilter !== "all" && log.entity_type !== entityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        (log.description && log.description.toLowerCase().includes(q)) ||
        (log.entity_id && String(log.entity_id).toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
              Seguridad y Auditoría
            </span>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono">
              {logs.length} eventos registrados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Activity className="size-7 text-emerald-400" />
            Registro de Actividad
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pista de auditoría cronológica de cambios realizados por administradores en la plataforma.
          </p>
        </div>

        <Button
          onClick={loadData}
          variant="outline"
          className="h-10 px-3 rounded-xl border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white self-start sm:self-auto"
        >
          <RefreshCw className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por acción o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Entidad:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Todas las entidades</option>
            <option value="products">Productos</option>
            <option value="categories">Categorías</option>
            <option value="orders">Pedidos</option>
            <option value="promotions">Promociones</option>
            <option value="banners">Banners</option>
            <option value="newsletter_subscribers">Newsletter</option>
            <option value="contact_messages">Mensajes</option>
            <option value="admin_settings">Configuración</option>
          </select>
        </div>
      </div>

      {/* Activity Table */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">Fecha y Hora</th>
                <th className="py-3.5 px-4">Acción</th>
                <th className="py-3.5 px-4">Entidad</th>
                <th className="py-3.5 px-4">ID Elemento</th>
                <th className="py-3.5 px-4 sm:px-6">Descripción del Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <RefreshCw className="size-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Cargando registro de auditoría...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Activity className="size-8 mx-auto text-slate-600 mb-2" />
                    No hay registros de actividad con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-slate-400 text-xs">
                      {new Date(log.created_at).toLocaleString("es-ES")}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white font-mono text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        {getEntityIcon(log.entity_type)}
                        <span>{log.entity_type || "general"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {log.entity_id || "—"}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-slate-300 text-xs">
                      {log.description || "Sin descripción adicional"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
