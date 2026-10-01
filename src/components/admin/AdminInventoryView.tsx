import React, { useState, useEffect } from "react";
import {
  Boxes,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Minus,
  SlidersHorizontal,
  History,
  AlertTriangle,
  CheckCircle2,
  X,
  Package,
} from "lucide-react";
import {
  getInventoryItems,
  getStockMovements,
  applyStockMovement,
  InventoryItem,
} from "@/services/admin/inventory";
import { StockMovement, StockMovementType } from "@/types/admin";
import { Button } from "@/components/ui/button";

export const AdminInventoryView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [threshold, setThreshold] = useState(5);
  const [activeTab, setActiveTab] = useState<"inventory" | "history">("inventory");
  const [isLoading, setIsLoading] = useState(true);

  // Movement Modal
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<"entrada" | "salida" | "ajuste" | "devolucion" | "danado">("entrada");
  const [movementQty, setMovementQty] = useState("10");
  const [movementReason, setMovementReason] = useState("");
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invItems, recentMovs] = await Promise.all([
        getInventoryItems({
          status: statusFilter,
          search: searchQuery,
          lowStockThreshold: threshold,
        }),
        getStockMovements(undefined, 30),
      ]);
      setItems(invItems);
      setMovements(recentMovs);
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery, threshold]);

  const openMovementModal = (item: InventoryItem, defaultType: "entrada" | "salida" | "ajuste" = "entrada") => {
    setSelectedProduct(item);
    setMovementType(defaultType);
    setMovementQty(defaultType === "ajuste" ? String(item.stock) : "5");
    setMovementReason("");
  };

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = parseInt(movementQty, 10);
    if (isNaN(qty) || qty < 0) {
      showToast("Por favor introduce una cantidad válida.");
      return;
    }

    setIsSubmittingMovement(true);
    try {
      const res = await applyStockMovement(
        selectedProduct.id,
        movementType,
        qty,
        movementReason.trim() || `Movimiento de ${movementType} registrado por admin`
      );

      if (res.success) {
        showToast(`Stock actualizado para "${selectedProduct.name}": nuevo stock ${res.newStock}.`);
        setSelectedProduct(null);
        loadData();
      } else {
        showToast(res.error || "No se pudo actualizar el stock.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado.";
      showToast(msg);
    } finally {
      setIsSubmittingMovement(false);
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
              Catálogo y Almacén
            </span>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono">
              Umbral alerta: &le; {threshold} uds
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Boxes className="size-7 text-emerald-400" />
            Control de Inventario
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Supervisa existencias, registra entradas, salidas, mermas y auditoría de movimientos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "inventory"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Stock
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === "history"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <History className="size-3.5" />
              Movimientos
            </button>
          </div>

          <Button
            onClick={loadData}
            variant="outline"
            className="h-10 px-3 rounded-xl border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {activeTab === "inventory" ? (
        <>
          {/* Controls Bar */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar producto por nombre..."
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

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
                {(
                  [
                    { id: "all", label: "Todos" },
                    { id: "in_stock", label: "En Stock" },
                    { id: "low_stock", label: "Stock Bajo" },
                    { id: "out_of_stock", label: "Agotado" },
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

              {/* Threshold control */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Alerta &le;</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value, 10) || 5))}
                  className="w-14 h-8 px-2 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4 sm:px-6">Producto</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4 text-center">Stock Actual</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Ajuste Rápido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <RefreshCw className="size-6 animate-spin mx-auto text-emerald-500 mb-2" />
                        Cargando inventario...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <Boxes className="size-8 mx-auto text-slate-600 mb-2" />
                        No se encontraron productos en el inventario.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 grid place-items-center">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Package className="size-5 text-slate-600" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-white group-hover:text-emerald-400 transition-colors block">
                                {item.name}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {item.unit || "1 unidad"} &bull; ID #{item.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-slate-400 text-xs">
                          {item.category_id || "Sin categoría"}
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-black text-base">
                          <span
                            className={
                              item.stock <= 0
                                ? "text-rose-400"
                                : item.stock <= threshold
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }
                          >
                            {item.stock}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          {item.stock <= 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/70 border border-rose-800 text-rose-400">
                              Agotado
                            </span>
                          ) : item.stock <= threshold ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/70 border border-amber-800 text-amber-400">
                              <AlertTriangle className="size-3" />
                              Stock Bajo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/70 border border-emerald-800 text-emerald-400">
                              En Stock
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openMovementModal(item, "entrada")}
                              className="h-8 px-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
                              title="Registrar Entrada"
                            >
                              <Plus className="size-3.5 mr-1" />
                              Entrada
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openMovementModal(item, "salida")}
                              className="h-8 px-2 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-950/40"
                              title="Registrar Salida"
                            >
                              <Minus className="size-3.5 mr-1" />
                              Salida
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openMovementModal(item, "ajuste")}
                              className="h-8 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Ajuste Absoluto"
                            >
                              <SlidersHorizontal className="size-3.5 mr-1" />
                              Ajustar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* History Tab */
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Fecha</th>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Tipo Movimiento</th>
                  <th className="py-3.5 px-4 text-center">Cantidad</th>
                  <th className="py-3.5 px-4 text-center">Prev &rarr; Nuevo</th>
                  <th className="py-3.5 px-4">Motivo</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <History className="size-8 mx-auto text-slate-600 mb-2" />
                      No hay historial de movimientos registrados aún.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-slate-400 text-xs">
                        {new Date(m.created_at).toLocaleString("es-ES")}
                      </td>

                      <td className="py-3.5 px-4 text-white font-medium">
                        {m.product?.name || `Producto #${m.product_id}`}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full font-mono text-[11px] bg-slate-950 border border-slate-800 text-slate-300 capitalize">
                          {m.movement_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {m.movement_type === "entrada" || m.movement_type === "devolucion" ? (
                          <span className="text-emerald-400">+{m.quantity}</span>
                        ) : m.movement_type === "salida" || m.movement_type === "danado" ? (
                          <span className="text-rose-400">-{m.quantity}</span>
                        ) : (
                          <span className="text-sky-400">&Delta; {m.quantity}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs">
                        {m.previous_stock ?? "—"} &rarr; {m.new_stock ?? "—"}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 text-xs max-w-xs truncate">
                        {m.reason || "Sin motivo registrado"}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right font-mono text-slate-500 text-xs">
                        {m.created_by || "sistema"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Movimiento de Inventario
                </h3>
                <p className="text-xs text-slate-400">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Stock Actual en Base de Datos:</span>
              <span className="font-mono font-black text-sm text-emerald-400">
                {selectedProduct.stock} unidades
              </span>
            </div>

            <form onSubmit={handleSubmitMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de Movimiento
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as StockMovementType)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="entrada">Entrada (Reabastecimiento de proveedor)</option>
                  <option value="salida">Salida (Venta externa o merma)</option>
                  <option value="ajuste">Ajuste de Conteo Físico (Nuevo stock exacto)</option>
                  <option value="devolucion">Devolución de Cliente</option>
                  <option value="danado">Producto Dañado / Roto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {movementType === "ajuste"
                    ? "Nuevo Stock Total (unidades)"
                    : "Cantidad de Unidades"}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Motivo o Justificación
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Llegada de lote de importación #451..."
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 resize-none focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  variant="outline"
                  className="rounded-xl border-slate-800 bg-slate-900 text-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingMovement}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5"
                >
                  {isSubmittingMovement ? "Procesando..." : "Confirmar Movimiento"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
