import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Eye,
  Calendar,
} from "lucide-react";
import { Banner } from "@/types/admin";
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  updateBannerOrder,
  CreateBannerInput,
} from "@/services/admin/banners";
import { Button } from "@/components/ui/button";

export const AdminBannersView: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formMobileImageUrl, setFormMobileImageUrl] = useState("");
  const [formButtonText, setFormButtonText] = useState("");
  const [formButtonUrl, setFormButtonUrl] = useState("");
  const [formPosition, setFormPosition] = useState("hero");
  const [formSortOrder, setFormSortOrder] = useState("1");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (err) {
      console.error("Error loading banners:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormTitle("");
    setFormSubtitle("");
    setFormDescription("");
    setFormImageUrl("https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80");
    setFormMobileImageUrl("");
    setFormButtonText("Ver Catálogo");
    setFormButtonUrl("#tienda");
    setFormPosition("hero");
    setFormSortOrder(String((banners.length + 1) * 10));
    setFormExpiresAt("");
    setFormIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    setEditingBanner(b);
    setFormTitle(b.title);
    setFormSubtitle(b.subtitle || "");
    setFormDescription(b.description || "");
    setFormImageUrl(b.image_url);
    setFormMobileImageUrl(b.mobile_image_url || "");
    setFormButtonText(b.button_text || "");
    setFormButtonUrl(b.button_url || "");
    setFormPosition(b.position || "hero");
    setFormSortOrder(String(b.sort_order));
    setFormExpiresAt(b.expires_at ? b.expires_at.substring(0, 10) : "");
    setFormIsActive(b.is_active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim() || !formImageUrl.trim()) {
      setFormError("El título y la imagen son obligatorios.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBanner) {
        const res = await updateBanner(editingBanner.id, {
          title: formTitle,
          subtitle: formSubtitle,
          description: formDescription,
          image_url: formImageUrl,
          mobile_image_url: formMobileImageUrl,
          button_text: formButtonText,
          button_url: formButtonUrl,
          position: formPosition,
          sort_order: parseInt(formSortOrder, 10) || 10,
          expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
          is_active: formIsActive,
        });

        if (res.success) {
          showToast(`Banner "${formTitle}" actualizado.`);
          setModalOpen(false);
          loadData();
        } else {
          setFormError(res.error || "No se pudo actualizar el banner.");
        }
      } else {
        const res = await createBanner({
          title: formTitle,
          subtitle: formSubtitle,
          description: formDescription,
          image_url: formImageUrl,
          mobile_image_url: formMobileImageUrl,
          button_text: formButtonText,
          button_url: formButtonUrl,
          position: formPosition,
          sort_order: parseInt(formSortOrder, 10) || 10,
          expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
          is_active: formIsActive,
        });

        if (res.success) {
          showToast(`Banner "${formTitle}" creado con éxito.`);
          setModalOpen(false);
          loadData();
        } else {
          setFormError(res.error || "No se pudo crear el banner.");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    try {
      const res = await toggleBannerActive(banner.id, banner.is_active);
      if (res.success) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
        );
        showToast(`Banner ahora está ${!banner.is_active ? "Activo" : "Inactivo"}.`);
      }
    } catch {
      showToast("Error al cambiar estado.");
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const currentBanner = banners[index];
    const targetBanner = banners[targetIndex];

    const currentOrder = currentBanner.sort_order;
    const targetOrder = targetBanner.sort_order;

    // Swap sort orders
    await Promise.all([
      updateBannerOrder(currentBanner.id, targetOrder),
      updateBannerOrder(targetBanner.id, currentOrder),
    ]);

    loadData();
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteBanner(bannerToDelete.id);
      if (res.success) {
        showToast("Banner eliminado con éxito.");
        setBannerToDelete(null);
        loadData();
      } else {
        showToast(res.error || "No se pudo eliminar el banner.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar.";
      showToast(msg);
    } finally {
      setIsDeleting(false);
    }
  };

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
              Personalización y Marca
            </span>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono">
              {banners.length} banners configurados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <ImageIcon className="size-7 text-emerald-400" />
            Banners Promocionales
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Administra carruseles, avisos de cabecera y promociones visuales de la tienda.
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
            Nuevo Banner
          </Button>
        </div>
      </div>

      {/* Banners Grid / List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-500">
            <RefreshCw className="size-8 animate-spin mx-auto text-emerald-500 mb-2" />
            Cargando banners de Supabase...
          </div>
        ) : banners.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-500">
            <ImageIcon className="size-10 mx-auto text-slate-600 mb-2" />
            No hay banners configurados. Haz clic en "Nuevo Banner" para crear uno.
          </div>
        ) : (
          banners.map((b, index) => (
            <div
              key={b.id}
              className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center gap-5 hover:border-slate-700 transition-all shadow-xl"
            >
              {/* Order Controls */}
              <div className="flex md:flex-col items-center gap-1 shrink-0 self-start md:self-center">
                <button
                  onClick={() => handleMoveOrder(index, "up")}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                  title="Subir posición"
                >
                  <ArrowUp className="size-4" />
                </button>
                <span className="font-mono text-xs font-bold text-slate-400 px-1">
                  #{b.sort_order}
                </span>
                <button
                  onClick={() => handleMoveOrder(index, "down")}
                  disabled={index === banners.length - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                  title="Bajar posición"
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>

              {/* Banner Preview Thumbnail */}
              <div className="w-full sm:w-56 h-28 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative group">
                <img
                  src={b.image_url}
                  alt={b.title}
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={b.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </div>

              {/* Banner Details */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-950 border border-slate-800 text-slate-400">
                    Posición: {b.position || "hero"}
                  </span>
                  {b.button_text && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
                      Botón: "{b.button_text}" &rarr; {b.button_url}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  {b.title}
                </h3>
                {b.subtitle && (
                  <p className="text-xs font-semibold text-emerald-400">{b.subtitle}</p>
                )}
                {b.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{b.description}</p>
                )}
              </div>

              {/* Actions & Status */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <button
                  onClick={() => handleToggleStatus(b)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    b.is_active
                      ? "bg-emerald-950/70 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60"
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      b.is_active ? "bg-emerald-400" : "bg-slate-600"
                    }`}
                  />
                  {b.is_active ? "Activo" : "Inactivo"}
                </button>

                <button
                  onClick={() => openEditModal(b)}
                  title="Editar banner"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Edit2 className="size-4" />
                </button>

                <button
                  onClick={() => setBannerToDelete(b)}
                  title="Eliminar banner"
                  className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 grid place-items-center text-emerald-400">
                  <ImageIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingBanner ? "Editar Banner" : "Nuevo Banner Promocional"}
                  </h3>
                  <p className="text-xs text-slate-400">Contenido visual y llamadas a la acción</p>
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
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Título Principal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sabores Auténticos en tu Hogar"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Subtítulo / Eyebrow
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Oferta por tiempo limitado"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Posición
                  </label>
                  <select
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="hero">Hero Principal</option>
                    <option value="promo_top">Cinta Superior</option>
                    <option value="store_top">Tienda / Catálogo</option>
                    <option value="footer_top">Antes del Pie de Página</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descripción o Mensaje
                </label>
                <textarea
                  rows={2}
                  placeholder="Texto complementario del banner..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white resize-none focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  URL de Imagen Principal *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  URL Imagen Móvil (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://... (si es diferente en pantallas pequeñas)"
                  value={formMobileImageUrl}
                  onChange={(e) => setFormMobileImageUrl(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Texto del Botón (CTA)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Comprar Ahora"
                    value={formButtonText}
                    onChange={(e) => setFormButtonText(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enlace del Botón
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: #tienda o /#admin"
                    value={formButtonUrl}
                    onChange={(e) => setFormButtonUrl(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Orden de Visualización
                  </label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(e.target.value)}
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
                  id="banner-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="size-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="banner-active" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Banner visible para los visitantes
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
                    : editingBanner
                    ? "Guardar Cambios"
                    : "Publicar Banner"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-900/60 bg-slate-900 p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="size-14 rounded-2xl bg-rose-950/80 border border-rose-800/80 grid place-items-center text-rose-400 mx-auto">
              <AlertTriangle className="size-7" />
            </div>
            <h3 className="text-lg font-bold text-white">
              ¿Eliminar banner "{bannerToDelete.title}"?
            </h3>
            <p className="text-xs text-slate-400">
              Esta acción no se puede deshacer. El banner se retirará de la página pública.
            </p>
            <div className="flex items-center justify-center gap-3 pt-3">
              <Button
                onClick={() => setBannerToDelete(null)}
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
