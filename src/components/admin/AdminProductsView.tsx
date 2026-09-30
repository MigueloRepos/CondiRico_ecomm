import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Check,
  X,
  Star,
  Sparkles,
  Flame,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Boxes,
} from "lucide-react";
import { Product, Category } from "@/types/database";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  toggleProductActive,
  updateProductStockQuick,
  CreateProductInput,
} from "@/services/admin/products";
import { getAdminCategories } from "@/services/admin/categories";
import { Button } from "@/components/ui/button";

export const AdminProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDetail, setFormDetail] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formOldPrice, setFormOldPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formUnit, setFormUnit] = useState("1 kg");
  const [formRating, setFormRating] = useState("4.9");
  const [formReviews, setFormReviews] = useState("10");
  const [formStock, setFormStock] = useState("50");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminProducts({
        categoryId: selectedCategory,
        searchQuery,
        onlyActive: statusFilter === "all" ? undefined : statusFilter === "active",
        lowStockOnly,
        page,
        pageSize,
      });
      setProducts(res.products);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAdminCategories().then(setCategories);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, selectedCategory, statusFilter, lowStockOnly]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSlug("");
    setFormDetail("");
    setFormPrice("");
    setFormOldPrice("");
    setFormCategory(categories[0]?.id || "alimentos");
    setFormBadge("");
    setFormUnit("1 kg");
    setFormRating("4.9");
    setFormReviews("12");
    setFormStock("50");
    setFormImageUrl("");
    setFormIsPopular(false);
    setFormIsFeatured(false);
    setFormIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSlug(p.slug || "");
    setFormDetail(p.detail || "");
    setFormPrice(String(p.price));
    setFormOldPrice(p.old_price ? String(p.old_price) : "");
    setFormCategory(p.category_id);
    setFormBadge(p.badge || "");
    setFormUnit(p.unit || "unidad");
    setFormRating(String(p.rating || 5.0));
    setFormReviews(String(p.reviews || 0));
    setFormStock(String(p.stock || 0));
    setFormImageUrl(p.image_url || "");
    setFormIsPopular(Boolean(p.is_popular));
    setFormIsFeatured(Boolean(p.is_featured));
    setFormIsActive(Boolean(p.is_active));
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(formPrice);
    const stockNum = parseInt(formStock, 10);
    const ratingNum = parseFloat(formRating);

    if (!formName.trim()) {
      setFormError("El nombre del producto es obligatorio.");
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Ingresa un precio válido mayor o igual a 0.");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError("Ingresa un stock válido mayor o igual a 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateProductInput = {
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        detail: formDetail.trim() || undefined,
        price: priceNum,
        old_price: formOldPrice ? parseFloat(formOldPrice) : null,
        category_id: formCategory,
        badge: formBadge.trim() || null,
        unit: formUnit.trim() || "unidad",
        rating: !isNaN(ratingNum) ? ratingNum : 5.0,
        reviews: parseInt(formReviews, 10) || 0,
        stock: stockNum,
        is_popular: formIsPopular,
        is_featured: formIsFeatured,
        is_active: formIsActive,
        image_url: formImageUrl.trim() || null,
      };

      if (editingProduct) {
        const res = await updateAdminProduct({
          id: editingProduct.id,
          ...payload,
        });
        if (!res.success) {
          setFormError(res.error || "No se pudo actualizar el producto.");
          return;
        }
        showToast(`Producto "${formName}" actualizado con éxito.`);
      } else {
        const res = await createAdminProduct(payload);
        if (!res.success) {
          setFormError(res.error || "No se pudo crear el producto.");
          return;
        }
        showToast(`Producto "${formName}" creado con éxito.`);
      }

      setModalOpen(false);
      loadProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (p: Product) => {
    const res = await toggleProductActive(p.id, p.is_active);
    if (res.success) {
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, is_active: !p.is_active } : item))
      );
      showToast(`Producto #${p.id} ${!p.is_active ? "activado" : "desactivado"}.`);
    } else {
      showToast(res.error || "No se pudo cambiar el estado.");
    }
  };

  const handleTogglePopular = async (p: Product) => {
    const res = await updateAdminProduct({ id: p.id, is_popular: !p.is_popular });
    if (res.success) {
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, is_popular: !p.is_popular } : item))
      );
      showToast(`Producto #${p.id} marcado como ${!p.is_popular ? "popular" : "estándar"}.`);
    }
  };

  const handleToggleFeatured = async (p: Product) => {
    const res = await updateAdminProduct({ id: p.id, is_featured: !p.is_featured });
    if (res.success) {
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, is_featured: !p.is_featured } : item))
      );
      showToast(`Producto #${p.id} marcado como ${!p.is_featured ? "destacado" : "normal"}.`);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      const res = await deleteAdminProduct(deleteConfirmId);
      if (res.success) {
        showToast("Producto eliminado exitosamente.");
        setDeleteConfirmId(null);
        loadProducts();
      } else {
        showToast(res.error || "No se pudo eliminar el producto.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold px-4 py-3 shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <Check className="size-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-bold">
            Catálogo &bull; {totalCount} en total
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestión de Productos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Administra precios, stock, categorías e imágenes sincronizadas con la tienda pública.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search box (col 5) */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, slug o detalle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Category Filter (col 3) */}
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (col 2) */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "all" | "active" | "inactive");
                setPage(1);
              }}
              className="w-full h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* Low Stock Toggle (col 2) */}
          <div className="lg:col-span-2 flex items-center">
            <button
              type="button"
              onClick={() => {
                setLowStockOnly(!lowStockOnly);
                setPage(1);
              }}
              className={`w-full h-10 rounded-2xl border px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                lowStockOnly
                  ? "bg-rose-950/80 border-rose-800 text-rose-300"
                  : "bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-white"
              }`}
            >
              <AlertTriangle className="size-3.5" />
              <span>Stock Bajo (&le; 5)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="size-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No se encontraron productos</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No hay coincidencias con los filtros aplicados. Intenta restablecer los términos de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Producto</th>
                  <th className="py-3.5 px-4 font-bold">Categoría</th>
                  <th className="py-3.5 px-4 font-bold">Precio</th>
                  <th className="py-3.5 px-4 font-bold">Stock</th>
                  <th className="py-3.5 px-4 font-bold text-center">Estado</th>
                  <th className="py-3.5 px-4 font-bold text-center">Destacado</th>
                  <th className="py-3.5 px-4 font-bold text-center">Popular</th>
                  <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p) => {
                  const isLowStock = p.stock <= 5;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Product Name & Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden shrink-0 grid place-items-center">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="size-full object-cover" />
                            ) : (
                              <Package className="size-5 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white truncate">{p.name}</span>
                              {p.badge && (
                                <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-bold shrink-0">
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {p.unit} &bull; {p.detail || p.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60">
                          {p.categories?.name || p.category_id}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-emerald-400 text-sm">
                          ${Number(p.price).toFixed(2)}
                        </div>
                        {p.old_price && (
                          <span className="text-[10px] text-slate-500 line-through">
                            ${Number(p.old_price).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold font-mono px-2 py-0.5 rounded-lg border text-xs ${
                              isOut
                                ? "bg-rose-950/80 border-rose-800 text-rose-300"
                                : isLowStock
                                ? "bg-amber-950/80 border-amber-800 text-amber-300"
                                : "bg-slate-800 border-slate-700 text-slate-200"
                            }`}
                          >
                            {p.stock}
                          </span>
                          <span className="text-[10px] text-slate-500">{p.unit}</span>
                        </div>
                      </td>

                      {/* Active toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`size-6 rounded-lg grid place-items-center mx-auto transition-colors ${
                            p.is_active
                              ? "bg-emerald-950 border border-emerald-700 text-emerald-400 hover:bg-emerald-900"
                              : "bg-slate-800 border border-slate-700 text-slate-500 hover:text-slate-300"
                          }`}
                          title={p.is_active ? "Desactivar producto" : "Activar producto"}
                        >
                          <Check className="size-3.5" />
                        </button>
                      </td>

                      {/* Featured toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(p)}
                          className={`size-6 rounded-lg grid place-items-center mx-auto transition-colors ${
                            p.is_featured
                              ? "bg-purple-950 border border-purple-700 text-purple-400"
                              : "bg-slate-800/40 text-slate-600 hover:text-slate-400"
                          }`}
                          title="Alternar destacado"
                        >
                          <Sparkles className="size-3.5" />
                        </button>
                      </td>

                      {/* Popular toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePopular(p)}
                          className={`size-6 rounded-lg grid place-items-center mx-auto transition-colors ${
                            p.is_popular
                              ? "bg-orange-950 border border-orange-700 text-orange-400"
                              : "bg-slate-800/40 text-slate-600 hover:text-slate-400"
                          }`}
                          title="Alternar popular"
                        >
                          <Flame className="size-3.5" />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Editar producto"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Mostrando página {page} de {totalPages} ({totalCount} productos)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Create / Edit Product */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-750 bg-slate-900 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">
                {editingProduct ? `Editar Producto #${editingProduct.id}` : "Nuevo Producto"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Arroz Grano Largo 1 kg"
                    className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Slug (opcional)</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="arroz-grano-largo"
                    className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* Detail / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descripción / Detalle</label>
                <input
                  type="text"
                  value={formDetail}
                  onChange={(e) => setFormDetail(e.target.value)}
                  placeholder="Ej. Bolsa seleccionada calidad premium"
                  className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Precio ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="2.85"
                    className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {/* Old Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Precio Anterior ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formOldPrice}
                    onChange={(e) => setFormOldPrice(e.target.value)}
                    placeholder="3.20"
                    className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Inventario (Stock) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="100"
                    className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Categoría *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Unidad</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="1 kg, 750 ml, pack"
                    className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Etiqueta (Badge)</label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="-15%, Oferta, Nuevo"
                    className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">URL de Imagen</label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {/* Rating and reviews */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Calificación (0 - 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formRating}
                    onChange={(e) => setFormRating(e.target.value)}
                    className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Reseñas (#)</label>
                  <input
                    type="number"
                    min="0"
                    value={formReviews}
                    onChange={(e) => setFormReviews(e.target.value)}
                    className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* Checkbox Toggles */}
              <div className="pt-2 flex flex-wrap items-center gap-6 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="size-4 rounded accent-emerald-500"
                  />
                  <span>Producto Activo (visible en tienda)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="size-4 rounded accent-purple-500"
                  />
                  <span>Destacado (Home)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="size-4 rounded accent-orange-500"
                  />
                  <span>Popular</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border-slate-700 bg-slate-800 text-xs font-bold text-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-950"
                >
                  {isSubmitting ? "Guardando en Supabase..." : editingProduct ? "Actualizar Producto" : "Crear Producto"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-850 bg-slate-900 p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="size-12 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-400 grid place-items-center mx-auto mb-4">
              <AlertTriangle className="size-6" />
            </div>

            <h3 className="text-lg font-black text-white">¿Eliminar producto?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Si este producto posee pedidos históricos asociados, para proteger la integridad contable se desactivará del catálogo en lugar de borrarse definitivamente.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border-slate-700 bg-slate-800 text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md shadow-rose-950"
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar producto"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
