import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  RefreshCw,
  X,
  ExternalLink,
} from "lucide-react";
import { ContactMessage } from "@/types/database";
import {
  getAdminMessages,
  updateMessageStatus,
  deleteMessage,
} from "@/services/admin/messages";
import { Button } from "@/components/ui/button";

const MESSAGE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  new: {
    label: "Nuevo",
    color: "text-amber-400",
    bg: "bg-amber-950/60",
    border: "border-amber-800/60",
  },
  read: {
    label: "Leído",
    color: "text-sky-400",
    bg: "bg-sky-950/60",
    border: "border-sky-800/60",
  },
  in_progress: {
    label: "En Curso",
    color: "text-indigo-400",
    bg: "bg-indigo-950/60",
    border: "border-indigo-800/60",
  },
  resolved: {
    label: "Resuelto",
    color: "text-emerald-400",
    bg: "bg-emerald-950/60",
    border: "border-emerald-800/60",
  },
  archived: {
    label: "Archivado",
    color: "text-slate-400",
    bg: "bg-slate-900",
    border: "border-slate-800",
  },
};

export const AdminMessagesView: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Selected message detail
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminMessages(statusFilter);
      setMessages(data);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    // If it was 'new', mark as 'read' automatically
    if (msg.status === "new") {
      try {
        await updateMessageStatus(msg.id, "read");
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m))
        );
        setSelectedMessage({ ...msg, status: "read" });
      } catch {
        // ignore
      }
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!selectedMessage) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateMessageStatus(selectedMessage.id, newStatus);
      if (res.success) {
        showToast(`Mensaje marcado como "${MESSAGE_STATUS_CONFIG[newStatus]?.label || newStatus}".`);
        setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
        setMessages((prev) =>
          prev.map((m) => (m.id === selectedMessage.id ? { ...m, status: newStatus } : m))
        );
      } else {
        showToast(res.error || "No se pudo actualizar el estado.");
      }
    } catch {
      showToast("Error al actualizar estado.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      const res = await deleteMessage(id);
      if (res.success) {
        showToast("Mensaje eliminado.");
        if (selectedMessage?.id === id) setSelectedMessage(null);
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {
      showToast("Error al eliminar mensaje.");
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        (m.topic && m.topic.toLowerCase().includes(q)) ||
        m.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
              Atención al Cliente
            </span>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono">
              {messages.length} mensajes recibidos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <MessageSquare className="size-7 text-emerald-400" />
            Mensajes de Contacto
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Bandeja de entrada de consultas, pedidos especiales y dudas de clientes.
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

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "Todos" },
            { id: "new", label: "Nuevos" },
            { id: "read", label: "Leídos" },
            { id: "in_progress", label: "En Curso" },
            { id: "resolved", label: "Resueltos" },
            { id: "archived", label: "Archivados" },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
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

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por remitente, tema, email o contenido del mensaje..."
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

      {/* Messages Table */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">Remitente</th>
                <th className="py-3.5 px-4">Tema / Asunto</th>
                <th className="py-3.5 px-4">Extracto</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="size-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Cargando mensajes de Supabase...
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <MessageSquare className="size-8 mx-auto text-slate-600 mb-2" />
                    No hay mensajes en esta bandeja.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => {
                  const cfg = MESSAGE_STATUS_CONFIG[msg.status] || {
                    label: msg.status,
                    color: "text-slate-400",
                    bg: "bg-slate-900",
                    border: "border-slate-800",
                  };
                  const isNew = msg.status === "new";

                  return (
                    <tr
                      key={msg.id}
                      onClick={() => handleOpenMessage(msg)}
                      className={`hover:bg-slate-800/30 transition-colors group cursor-pointer ${
                        isNew ? "bg-emerald-950/15" : ""
                      }`}
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          {isNew && (
                            <span className="size-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                          )}
                          <div>
                            <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {msg.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {msg.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-300 font-medium">
                        {msg.topic || "Consulta general"}
                      </td>

                      <td className="py-4 px-4 text-slate-400 text-xs max-w-xs truncate">
                        {msg.message}
                      </td>

                      <td className="py-4 px-4 text-slate-400 text-xs font-mono">
                        {new Date(msg.created_at || "").toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.border} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMessage(msg);
                            }}
                            className="h-8 px-2 rounded-lg text-slate-400 hover:text-white"
                          >
                            <Eye className="size-4 text-emerald-400 mr-1" />
                            Leer
                          </Button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(msg.id);
                            }}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 grid place-items-center text-emerald-400">
                  <MessageSquare className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedMessage.topic || "Mensaje de Contacto"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Recibido el {new Date(selectedMessage.created_at || "").toLocaleString("es-ES")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Sender details */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Remitente:</span>
                <strong className="text-white text-sm">{selectedMessage.name}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Email:</span>
                <a
                  href={`mailto:${selectedMessage.email}`}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <Mail className="size-3.5" />
                  {selectedMessage.email}
                </a>
              </div>
              {selectedMessage.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Teléfono:</span>
                  <a
                    href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <Phone className="size-3.5" />
                    {selectedMessage.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Cuerpo del Mensaje
              </span>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>

            {/* Status change actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Cambiar Estado
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "read", label: "Marcar Leído" },
                  { id: "in_progress", label: "En Curso" },
                  { id: "resolved", label: "Resolver" },
                  { id: "archived", label: "Archivar" },
                ].map((st) => (
                  <button
                    key={st.id}
                    disabled={isUpdatingStatus || selectedMessage.status === st.id}
                    onClick={() => handleChangeStatus(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedMessage.status === st.id
                        ? "bg-emerald-600 text-white cursor-default"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="flex gap-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re:%20${encodeURIComponent(
                    selectedMessage.topic || "Consulta CondiRico"
                  )}`}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
                >
                  <Mail className="size-3.5" />
                  Responder por Email
                </a>
                {selectedMessage.phone && (
                  <a
                    href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hola ${selectedMessage.name}, te contactamos desde CondiRico con respecto a tu consulta.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Phone className="size-3.5" />
                    WhatsApp
                  </a>
                )}
              </div>

              <Button
                onClick={() => setSelectedMessage(null)}
                variant="outline"
                className="rounded-xl border-slate-800 bg-slate-900 text-slate-300"
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
