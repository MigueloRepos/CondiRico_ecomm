import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Boxes,
  MessageSquare,
  Check,
  RefreshCw,
  ExternalLink,
  Info,
} from "lucide-react";
import { AdminNotification } from "@/types/admin";
import {
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/admin/notifications";
import { Button } from "@/components/ui/button";

interface AdminNotificationsViewProps {
  onNavigateTab?: (tab: string, param?: string | number) => void;
}

export const AdminNotificationsView: React.FC<AdminNotificationsViewProps> = ({
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminNotifications(50);
      setNotifications(data);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAsRead = async (id: string | number) => {
    const ok = await markNotificationRead(id);
    if (ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    const ok = await markAllNotificationsRead();
    if (ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="size-4 text-emerald-400" />;
      case "low_stock":
        return <Boxes className="size-4 text-amber-400" />;
      case "message":
        return <MessageSquare className="size-4 text-sky-400" />;
      case "alert":
        return <AlertTriangle className="size-4 text-rose-400" />;
      default:
        return <Info className="size-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
              Alertas del Sistema
            </span>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono">
              {notifications.filter((n) => !n.is_read).length} sin leer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Bell className="size-7 text-emerald-400" />
            Notificaciones Administrativas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registro de eventos clave: nuevos pedidos, stock bajo, consultas de clientes y auditoría.
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

          {notifications.some((n) => !n.is_read) && (
            <Button
              onClick={handleMarkAllRead}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <Check className="size-4" />
              Marcar Todas Leídas
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800 w-fit">
        {(
          [
            { id: "all", label: "Todas" },
            { id: "unread", label: "Sin Leer" },
            { id: "read", label: "Leídas" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
              filter === f.id
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-500">
            <RefreshCw className="size-8 animate-spin mx-auto text-emerald-500 mb-2" />
            Cargando notificaciones...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-500">
            <Bell className="size-8 mx-auto text-slate-600 mb-2" />
            No hay notificaciones en este filtro.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 transition-all flex items-start justify-between gap-4 ${
                !n.is_read
                  ? "bg-slate-900/90 border-emerald-800/60 shadow-lg shadow-emerald-950/20"
                  : "bg-slate-900/40 border-slate-800/80 opacity-75"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-xl bg-slate-950 border border-slate-800 grid place-items-center shrink-0 mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{n.title}</h3>
                    {!n.is_read && (
                      <span className="size-2 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="text-[11px] font-mono text-slate-500 mt-2 block">
                    {new Date(n.created_at).toLocaleString("es-ES")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.link && onNavigateTab && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (!n.is_read) handleMarkAsRead(n.id);
                      const tab = n.link?.replace(/^\//, "");
                      if (tab) onNavigateTab(tab);
                    }}
                    className="h-8 px-2.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 text-xs"
                  >
                    Ver
                    <ExternalLink className="size-3.5 ml-1" />
                  </Button>
                )}

                {!n.is_read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkAsRead(n.id)}
                    className="h-8 px-2.5 rounded-lg text-slate-400 hover:text-white text-xs"
                    title="Marcar como leída"
                  >
                    <Check className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
