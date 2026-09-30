import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Percent,
  DollarSign,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Copy,
  Clock,
} from "lucide-react";
import { Promotion, PromotionDiscountType } from "@/types/admin";
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionActive,
  CreatePromotionInput,
} from "@/services/admin/promotions";
import { Button } from "@/components/ui/button";

export const AdminPromotionsView: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = useState("10");
  const [formUsageLimit, setFormUsageLimit] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [promoToDelete, setPromoToDelete] = useState<Promotion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getPromotions();
      setPromotions(data);
    } catch (err) {
      console.error("Error loading promotions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormType("percentage");
    setFormValue("15");
    setFormUsageLimit("");
    setFormExpiresAt("");
    setFormIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Promotion) => {
    setEditingPromo(p);
    setFormCode(p.code);
    setFormName(p.name);
    setFormDescription(p.description || "");
    setFormType(p.discount_type === "fixed" ? "fixed" : "percentage");
    setFormValue(String(p.discount_value));
    setFormUsageLimit(p.usage_limit ? String(p.usage_limit) : "");
    setFormExpiresAt(p.expires_at ? p.expires_at.substring(0, 10) : "");
    setFormIsActive(p.is_active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const val = parseFloat(formValue);
    if (isNaN(val) || val <= 0) {
      setFormError("El valor del descuento debe ser mayor que 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPromo) {
        const res = await updatePromotion(editingPromo.id, {
          name: formName,
          description: formDescription,
          discount_type: formType,
          discount_value: val,
          usage_limit: formUsageLimit ? parseInt(formUsageLimit, 10) : null,
          expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
          is_active: formIsActive,
        });

        if (res.success) {
          showToast(`Cupón ${editingPromo.code} actualizado.`);
          setModalOpen(false);
          loadData();
        } else {
          setFormError(res.error || "No se pudo actualizar la promoción.");
        }
      } else {
        const res = await createPromotion({
          code: formCode,
          name: formName,
          description: formDescription,
          discount_type: formType,
          discount_value: val,
          usage_limit: formUsageLimit ? parseInt(formUsageLimit, 10) : null,
          expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
          is_active: formIsActive,
        });

        if (res.success) {
          showToast(`Promoción ${formCode.toUpperCase()} creada con éxito.`);
          setModalOpen(false);
          loadData();
        } else {
          setFormError(res.error || "No se pudo crear la promoción.");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (promo: Promotion) => {
    try {
      const res = await togglePromotionActive(promo.id, promo.is_active);
      if (res.success) {
        setPromotions((prev) =>
          prev.map((p) => (p.id === promo.id ? { ...p, is_active: !p.is_active } : p))
        );
        showToast(`Cupón ${promo.code} ahora está ${!promo.is_active ? "Activo" : "Inactivo"}.`);
      }
    } catch {
      showToast("Error al cambiar estado.");
    }
  };

  const handleDelete = async () => {
    if (!promoToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deletePromotion(promoToDelete.id);
      if (res.success) {
        showToast(`Promoción ${promoToDelete.code} eliminada.`);
        setPromoToDelete(null);
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

  const filteredPromotions = promotions.filter((p) => {
    if (statusFilter === "active" && !p.is_active) return false;
    if (statusFilter === "inactive" && p.is_active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
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
              Marketing y Ventas
            </span>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono">
              {promotions.length} cupones registrados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Tag className="size-7 text-emerald-400" />
            Cupones y Promociones
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Crea códigos de descuento en porcentaje o monto fijo para campañas comerciales.
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
            onClick={openCreateModal}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            <Plus className="size-4" />
            Nueva Promoción
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por código de cupón o nombre..."
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
                { id: "all", label: "Todas" },
                { id: "active", label: "Activas" },
                { id: "inactive", label: "Inactivas" },
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

      {/* Promotions Table */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">Código Cupón</th>
                <th className="py-3.5 px-4">Campaña</th>
                <th className="py-3.5 px-4">Descuento</th>
                <th className="py-3.5 px-4 text-center">Límite Usos</th>
                <th className="py-3.5 px-4">Vencimiento</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="size-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Cargando promociones de Supabase...
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Tag className="size-8 mx-auto text-slate-600 mb-2" />
                    No se encontraron promociones registradas.
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((p) => {
                  const isExpired = p.expires_at && new Date(p.expires_at) < new Date();
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-emerald-400 text-xs sm:text-sm tracking-wider">
                            {p.code}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(p.code);
                              showToast(`Código "${p.code}" copiado al portapapeles.`);
                            }}
                            title="Copiar código"
                            className="text-slate-500 hover:text-white transition-colors"
                          >
                            <Copy className="size-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-white block">{p.name}</span>
                        {p.description && (
                          <span className="text-[11px] text-slate-400 block max-w-xs truncate">
                            {p.description}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold">
                        {p.discount_type === "percentage" ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <Percent className="size-3.5" />
                            {p.discount_value}% OFF
                          </span>
                        ) : (
                          <span className="text-sky-400 flex items-center gap-0.5">
                            <DollarSign className="size-3.5" />${p.discount_value} OFF
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center font-mono text-slate-400 text-xs">
                        {p.usage_limit ? `${p.usage_limit} veces` : "Ilimitado"}
                      </td>

                      <td className="py-4 px-4 text-slate-400 text-xs">
                        {p.expires_at ? (
                          <div className={isExpired ? "text-rose-400 flex items-center gap-1" : ""}>
                            {isExpired && <AlertTriangle className="size-3" />}
                            {new Date(p.expires_at).toLocaleDateString("es-ES")}
                            {isExpired && " (Vencido)"}
                          </div>
                        ) : (
                          "Sin vencimiento"
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            p.is_active && !isExpired
                              ? "bg-emerald-950/70 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60"
                              : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              p.is_active && !isExpired ? "bg-emerald-400" : "bg-slate-600"
                            }`}
                          />
                          {p.is_active && !isExpired ? "Activo" : "Inactivo"}
                        </button>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            title="Editar cupón"
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            onClick={() => setPromoToDelete(p)}
                            title="Eliminar cupón"
                            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 grid place-items-center text-emerald-400">
                  <Tag className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingPromo ? "Editar Cupón" : "Crear Nueva Promoción"}
                  </h3>
                  <p className="text-xs text-slate-400">Configuración de cupones de descuento</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/70 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Código de Cupón *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPromo}
                    placeholder="Ej: CONDIVIP20"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono uppercase tracking-wider disabled:opacity-50 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre Descriptivo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Descuento 20% Fin de Semana"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descripción
                </label>
                <input
                  type="text"
                  placeholder="Detalles o condiciones del cupón..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tipo de Descuento
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as PromotionDiscountType)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Valor del Descuento *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Límite de Usos (opcional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Vacío para ilimitado"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Fecha de Expiración (opcional)
                  </label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <input
                  type="checkbox"
                  id="promo-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="size-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="promo-active" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Cupón activo y aplicable en compras
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  variant="outline"
                  className="rounded-xl border-slate-800 bg-slate-900 text-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6"
                >
                  {isSubmitting
                    ? "Guardando..."
                    : editingPromo
                    ? "Guardar Cambios"
                    : "Crear Cupón"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {promoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-900/60 bg-slate-900 p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="size-14 rounded-2xl bg-rose-950/80 border border-rose-800/80 grid place-items-center text-rose-400 mx-auto">
              <AlertTriangle className="size-7" />
            </div>
            <h3 className="text-lg font-bold text-white">
              ¿Eliminar cupón "{promoToDelete.code}"?
            </h3>
            <p className="text-xs text-slate-400">
              Esta acción no se puede deshacer. Los clientes ya no podrán canjear este código.
            </p>
            <div className="flex items-center justify-center gap-3 pt-3">
              <Button
                onClick={() => setPromoToDelete(null)}
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
