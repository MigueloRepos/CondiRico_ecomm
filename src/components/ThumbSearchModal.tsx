import React, { useState, useMemo } from "react";
import { Search, X, Plus, Check, ArrowRight } from "lucide-react";
import { ALL_PRODUCTS } from "@/data/products";

interface ThumbSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (id: number, amount: number) => void;
  cart: Record<number, number>;
  onNavigateToStore: () => void;
}

const POPULAR_SEARCHES = [
  "Arroz",
  "Aceite de oliva",
  "Detergente",
  "Leche",
  "Huevos",
  "Papel",
  "Pasta",
  "Atún",
];

export const ThumbSearchModal: React.FC<ThumbSearchModalProps> = ({
  isOpen,
  onClose,
  onAddToCart,
  cart,
  onNavigateToStore,
}) => {
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return ALL_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.detail.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/35 backdrop-blur-md transition-opacity duration-300 md:hidden"
      onClick={onClose}
    >
      <div
        className="absolute bottom-0 inset-x-0 rounded-t-[36px] liquid-glass-dock p-6 pt-3 shadow-[0_-25px_60px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-400 max-h-[85vh] overflow-y-auto pb-[max(2.5rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab pill handle */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/30 shadow-xs" />

        <div className="flex items-center justify-between pb-3 border-b border-white/60">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-offer">
              Búsqueda Inteligente
            </span>
            <h3 className="text-xl font-black text-brand-deep">
              ¿Qué buscas hoy?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-white/70 text-muted-foreground border border-white/80 shadow-xs active:scale-90"
            aria-label="Cerrar búsqueda"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Input in natural thumb reach with frosted glass effect */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe arroz, detergente, aceite..."
            className="h-12 w-full rounded-2xl border border-white/80 bg-white/70 pl-11 pr-11 text-sm outline-none shadow-inner backdrop-blur-md transition-all focus:bg-white focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-full bg-muted/80 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Popular thumb tags */}
        {!query && (
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Búsquedas sugeridas
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="rounded-full border border-white/90 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs active:scale-95 transition-all hover:bg-white hover:text-primary hover:border-primary/30"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results list */}
        {query && (
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Resultados encontrados</span>
              <span>{searchResults.length} productos</span>
            </div>

            {searchResults.map((product) => {
              const inCart = cart[product.id] ?? 0;
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl liquid-glass-card shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {product.detail} ·{" "}
                      <strong className="text-primary font-bold">
                        ${product.price.toFixed(2)}
                      </strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddToCart(product.id, 1)}
                    className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 active:scale-90 liquid-glass-button"
                    aria-label={`Agregar ${product.name} al carrito`}
                  >
                    {inCart > 0 ? (
                      <Check className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </button>
                </div>
              );
            })}

            {searchResults.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No encontramos productos con "{query}".
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToStore();
              }}
              className="mt-4 w-full h-11 rounded-2xl bg-white/80 border border-white text-xs font-bold text-primary flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <span>Ver catálogo completo en la Tienda</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
