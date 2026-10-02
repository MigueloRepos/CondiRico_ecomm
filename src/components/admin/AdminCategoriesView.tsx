import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  FolderPlus,
  Package,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  AdminCategoryWithCount,
} from "@/services/admin/categories";
import { Button } from "@/components/ui/button";

export const AdminCategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<AdminCategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryWithCount | null>(null);

  // Form states
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formShortName, setFormShortName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("10");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategoryWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminCategories();
      setCategories(data);
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormId("");
    setFormName("");
    setFormShortName("");
    setFormDescription("");
    setFormSortOrder(String((categories.length + 1) * 10));
    setFormIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: AdminCategoryWithCount) => {
    setEditingCategory(cat);
    setFormId(cat.id);
    setFormName(cat.name);
    setFormShortName(cat.short_name || cat.name);
    setFormDescription(cat.description || "");
    setFormSortOrder(String(cat.sort_order ?? 10));
    setFormIsActive(cat.is_active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError("El nombre de la categoría es obligatorio.");
      return;
    }

    const cleanId = formId.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
    if (!editingCategory && !cleanId) {
      setFormError("El ID identificador (slug) no pudo generarse.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const res = await updateCategory(editingCategory.id, {
          name: formName,
          short_name: formShortName,
          description: formDescription,
          sort_order: parseInt(formSortOrder, 10) || 10,
          is_active: formIsActive,
        });

        if (res.success) {
          showToast(`Categoría "${formName}" actualizada con éxito.`);
          setModalOpen(false);
          loadData();
        } else {
          setFormError(res.error || "Error al actualizar la categoría.");
        }
      } else {
        const res = await createCategory({
          id: cleanId,
          name: formName,
          short_name: formShortName,
          description: formDescription,
          sort_order: parseInt(formSortOrder, 10) || 10,
          is_active: formIsActive,
        });

        if (res.success) {
          showToast(`Categoría "${formName}" creada con éxito.`);
          setModalOpen(false);
          loadData();
        } else {
          setFormError(res.error || "Error al crear la categoría.");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: AdminCategoryWithCount) => {
    try {
      const res = await updateCategory(cat.id, { is_active: !cat.is_active });
      if (res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
        );
        showToast(
          `Categoría "${cat.name}" ahora está ${!cat.is_active ? "Activa" : "Inactiva"}.`
        );
      }
    } catch {
      showToast("Error al cambiar estado.");
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteCategory(categoryToDelete.id);
      if (res.success) {
        showToast(`Categoría "${categoryToDelete.name}" eliminada.`);
        setCategoryToDelete(null);
        loadData();
      } else {
        showToast(res.error || "No se pudo eliminar la categoría.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar.";
      showToast(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (statusFilter === "active" && !c.is_active) return false;
    if (statusFilter === "inactive" && c.is_active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-600 text-white px-5 py-3 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <Check className="size-5 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
              Catálogo
            </span>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono">
              {categories.length} categorías registradas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Layers className="size-7 text-emerald-400" />
            Categorías
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organiza los productos de tu tienda en secciones y controla su orden de visualización.
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
            Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o ID de categoría..."
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

      {/* Categories Table */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">Categoría</th>
                <th className="py-3.5 px-4">Slug / ID</th>
                <th className="py-3.5 px-4">Descripción</th>
                <th className="py-3.5 px-4 text-center">Orden</th>
                <th className="py-3.5 px-4 text-center">Productos</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="size-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Cargando categorías de Supabase...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Layers className="size-8 mx-auto text-slate-600 mb-2" />
                    No se encontraron categorías con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-slate-800/80 border border-slate-700/60 grid place-items-center text-emerald-400 shrink-0">
                          <Layers className="size-4" />
                        </div>
                        <div>
                          <span className="font-bold text-white group-hover:text-emerald-400 transition-colors block">
                            {cat.name}
                          </span>
                          {cat.short_name && cat.short_name !== cat.name && (
                            <span className="text-[11px] text-slate-400">
                              Nombre corto: {cat.short_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                        {cat.id}
                      </span>
                    </td>

                    <td className="py-4 px-4 max-w-xs truncate text-slate-400 text-xs">
                      {cat.description || "—"}
                    </td>

                    <td className="py-4 px-4 text-center font-mono text-slate-300">
                      {cat.sort_order ?? 10}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                        <Package className="size-3" />
                        {cat.product_count}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        title="Click para cambiar estado"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          cat.is_active
                            ? "bg-emerald-950/70 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60"
                            : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            cat.is_active ? "bg-emerald-400" : "bg-slate-600"
                          }`}
                        />
                        {cat.is_active ? "Activa" : "Inactiva"}
                      </button>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(cat)}
                          title="Editar categoría"
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="size-4" />
                        </button>

                        <button
                          onClick={() => setCategoryToDelete(cat)}
                          title="Eliminar categoría"
                          className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 grid place-items-center text-emerald-400">
                  <Layers className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configuración de categoría en Supabase
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/70 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre de la categoría *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Especias y Condimentos"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingCategory) {
                      setFormId(
                        e.target.value
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]/g, "-")
                          .replace(/-+/g, "-")
                      );
                    }
                  }}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Identificador (Slug / ID) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCategory}
                    placeholder="ej: especias"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono disabled:opacity-50 focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                  {editingCategory && (
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      El ID no se puede modificar una vez creado.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre Corto (menú / chips)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Especias"
                    value={formShortName}
                    onChange={(e) => setFormShortName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  placeholder="Breve resumen de los productos de esta categoría..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white resize-none focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Orden de aparición (número)
                  </label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-start sm:gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800 mt-1 sm:mt-6">
                  <span className="text-xs font-semibold text-slate-300">
                    Visible en tienda
                  </span>
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="size-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  variant="outline"
                  className="rounded-xl border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 shadow-lg shadow-emerald-950/50"
                >
                  {isSubmitting
                    ? "Guardando..."
                    : editingCategory
                    ? "Guardar Cambios"
                    : "Crear Categoría"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar con comprobación de productos */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-900/60 bg-slate-900 p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="size-14 rounded-2xl bg-rose-950/80 border border-rose-800/80 grid place-items-center text-rose-400 mx-auto">
              <AlertTriangle className="size-7" />
            </div>

            <h3 className="text-lg font-bold text-white">
              ¿Eliminar categoría "{categoryToDelete.name}"?
            </h3>

            {categoryToDelete.product_count > 0 ? (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs text-left space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <X className="size-4 shrink-0" />
                  Operación bloqueada por seguridad
                </p>
                <p>
                  Esta categoría tiene{" "}
                  <strong>{categoryToDelete.product_count} producto(s)</strong> asociados.
                  Debes reasignar o eliminar esos productos antes de poder borrar la categoría.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Esta acción no se puede deshacer. Se eliminará la categoría{" "}
                <strong className="text-slate-200">{categoryToDelete.name}</strong>{" "}
                permanentemente de la base de datos Supabase.
              </p>
            )}

            <div className="flex items-center justify-center gap-3 pt-3">
              <Button
                onClick={() => setCategoryToDelete(null)}
                variant="outline"
                className="rounded-xl border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
              >
                Cerrar
              </Button>
              {categoryToDelete.product_count === 0 && (
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 shadow-lg shadow-rose-950/50"
                >
                  {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
