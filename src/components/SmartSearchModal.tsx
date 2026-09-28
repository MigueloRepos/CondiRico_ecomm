import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, ShoppingBag, Plus, ArrowRight, Sparkles } from "lucide-react";
import { ProductItem, CategoryInfo, CategoryId } from "@/data/products";

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  productsList: ProductItem[];
  categoriesList: CategoryInfo[];
  onAddToCart: (id: number, amount: number) => void;
  onSelectProduct?: (product: ProductItem) => void;
  onNavigateToCategory?: (categoryId: CategoryId) => void;
  onNavigateToStore: () => void;
}

const POPULAR_SEARCH_TERMS = [
  "Arroz",
  "Aceite de Oliva",
  "Azúcar",
  "Atún",
  "Frijoles",
  "Harina",
  "Cemento",
];

export const SmartSearchModal: React.FC<SmartSearchModalProps> = ({
  isOpen,
  onClose,
  productsList,
  categoriesList,
  onAddToCart,
  onSelectProduct,
  onNavigateToCategory,
  onNavigateToStore,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Search Filtering
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();
    return productsList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.detail.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [searchTerm, productsList]);

  // Category Matches
  const matchedCategories = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();
    return categoriesList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q)
    );
  }, [searchTerm, categoriesList]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#12352C]/40 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 lg:p-10 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E5EAE6] shadow-2xl overflow-hidden mt-6 sm:mt-12 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-[#E5EAE6]">
          <Search className="size-5 text-[#075B3A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos, granos, enlatados, materiales..."
            className="flex-1 bg-transparent text-base sm:text-lg text-[#12352C] placeholder:text-[#66736D] outline-none font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="p-1 rounded-full text-[#66736D] hover:bg-[#F8F7F2]"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:inline-flex items-center text-xs font-medium text-[#66736D] px-2 py-1 rounded bg-[#F8F7F2] border border-[#E5EAE6]"
          >
            ESC
          </button>
        </div>

        {/* Quick Filters / Popular Suggestions when empty */}
        {!searchTerm && (
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[#66736D] mb-3">
              Búsquedas populares
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCH_TERMS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSearchTerm(term)}
                  className="rounded-full border border-[#E5EAE6] bg-[#F8F7F2] px-3.5 py-1.5 text-xs font-medium text-[#12352C] hover:border-[#075B3A] hover:bg-white hover:text-[#075B3A] transition-all"
                >
                  {term}
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-[#E5EAE6]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#66736D]">
                  Categorías principales
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToStore();
                  }}
                  className="text-xs font-semibold text-[#075B3A] hover:underline flex items-center gap-1"
                >
                  <span>Ver todas</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {categoriesList.slice(0, 4).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNavigateToCategory) onNavigateToCategory(cat.id);
                      else onNavigateToStore();
                    }}
                    className="p-3 text-left rounded-2xl border border-[#E5EAE6] bg-white hover:border-[#075B3A] hover:shadow-xs transition-all"
                  >
                    <p className="text-xs font-bold text-[#12352C] truncate">{cat.name}</p>
                    <p className="text-[11px] text-[#66736D] mt-0.5">{cat.count}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Container */}
        {searchTerm && (
          <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Category matches if any */}
            {matchedCategories.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#66736D] mb-2 px-2">
                  Categorías coincidentes
                </p>
                <div className="flex flex-wrap gap-2">
                  {matchedCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onNavigateToCategory) onNavigateToCategory(cat.id);
                        else onNavigateToStore();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0F6F2] border border-[#CBD5CE] text-xs font-bold text-[#075B3A] hover:bg-[#075B3A] hover:text-white transition-all"
                    >
                      <Sparkles className="size-3" />
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product items */}
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#66736D] mb-2 px-2">
                  Productos ({searchResults.length})
                </p>
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="group flex items-center justify-between gap-4 p-3 rounded-2xl border border-transparent hover:border-[#E5EAE6] hover:bg-[#F8F7F2] transition-all cursor-pointer"
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(product);
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="size-14 rounded-xl bg-white border border-[#E5EAE6] overflow-hidden shrink-0 grid place-items-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="size-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <ShoppingBag className="size-6 text-[#075B3A]/60" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[#66736D] font-medium uppercase tracking-wider">
                          {product.unit}
                        </p>
                        <h4 className="text-sm font-bold text-[#12352C] truncate group-hover:text-[#075B3A] transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-xs text-[#66736D] line-clamp-1">{product.detail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-bold text-[#12352C]">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.oldPrice && (
                          <span className="block text-[11px] text-[#66736D] line-through">
                            ${product.oldPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product.id, 1);
                        }}
                        className="grid size-9 place-items-center rounded-full bg-[#075B3A] text-white hover:bg-[#0B7A45] active:scale-95 transition-all shadow-sm"
                        aria-label={`Agregar ${product.name} al carrito`}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="grid size-12 place-items-center rounded-full bg-[#F8F7F2] text-[#66736D] mx-auto mb-3">
                  <Search className="size-6" />
                </div>
                <h4 className="text-base font-bold text-[#12352C]">
                  No encontramos resultados para "{searchTerm}"
                </h4>
                <p className="text-xs text-[#66736D] mt-1 max-w-sm mx-auto">
                  Intenta buscar por otro término o navega por nuestro catálogo completo.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToStore();
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#075B3A] text-white px-5 py-2 text-xs font-bold shadow-xs hover:bg-[#0B7A45]"
                >
                  <span>Ver catálogo completo</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-[#F8F7F2] border-t border-[#E5EAE6] flex items-center justify-between text-[11px] text-[#66736D]">
          <span>Catálogo activo en tiempo real con Supabase</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToStore();
            }}
            className="font-semibold text-[#075B3A] hover:underline"
          >
            Abrir tienda completa →
          </button>
        </div>
      </div>
    </div>
  );
};
