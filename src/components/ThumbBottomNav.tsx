import React, { useState } from "react";
import {
  Home,
  Store,
  LayoutGrid,
  Search,
  ShoppingCart,
  X,
  ArrowRight,
  UtensilsCrossed,
  ShoppingBasket,
  Sparkles,
  Home as HomeIcon,
} from "lucide-react";
import { CATEGORIES, CategoryId } from "@/data/products";

interface ThumbBottomNavProps {
  currentPage: "inicio" | "tienda";
  onNavigate: (page: "inicio" | "tienda", categoryId?: CategoryId) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
}

const categoryIcons = {
  alimentos: UtensilsCrossed,
  "primera-necesidad": ShoppingBasket,
  limpieza: Sparkles,
  utiles: HomeIcon,
};

export const ThumbBottomNav: React.FC<ThumbBottomNavProps> = ({
  currentPage,
  onNavigate,
  cartCount,
  onOpenCart,
  onOpenSearch,
}) => {
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const handleCategorySelect = (catId: CategoryId) => {
    setCategorySheetOpen(false);
    onNavigate("tienda", catId);
  };

  return (
    <>
      {/* Apple Liquid Glass 2026: Floating Thumb Dock */}
      <div className="fixed bottom-3 inset-x-3 z-40 md:hidden pointer-events-none">
        <nav
          aria-label="Navegación móvil flotante Liquid Glass"
          className="pointer-events-auto mx-auto max-w-md liquid-glass-dock rounded-[28px] px-2 py-1.5 shadow-[0_20px_50px_-10px_rgba(20,83,45,0.22),0_4px_16px_rgba(0,0,0,0.06)]"
        >
          <div className="grid grid-cols-5 items-center justify-items-center">
            {/* 1. Inicio */}
            <button
              type="button"
              onClick={() => onNavigate("inicio")}
              className={`group relative flex flex-col items-center justify-center w-full py-1.5 text-center transition-all duration-300 active:scale-90 ${
                currentPage === "inicio"
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Ir a Inicio"
            >
              <div
                className={`grid size-10 place-items-center rounded-2xl transition-all duration-300 ${
                  currentPage === "inicio"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
                    : "hover:bg-white/60 group-hover:scale-105"
                }`}
              >
                <Home className="size-[18px]" />
              </div>
              <span className="text-[10px] tracking-tight leading-tight mt-1">
                Inicio
              </span>
            </button>

            {/* 2. Tienda */}
            <button
              type="button"
              onClick={() => onNavigate("tienda")}
              className={`group relative flex flex-col items-center justify-center w-full py-1.5 text-center transition-all duration-300 active:scale-90 ${
                currentPage === "tienda"
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Ir a Tienda completa"
            >
              <div
                className={`grid size-10 place-items-center rounded-2xl transition-all duration-300 ${
                  currentPage === "tienda"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
                    : "hover:bg-white/60 group-hover:scale-105"
                }`}
              >
                <Store className="size-[18px]" />
              </div>
              <span className="text-[10px] tracking-tight leading-tight mt-1">
                Tienda
              </span>
            </button>

            {/* 3. Categorías */}
            <button
              type="button"
              onClick={() => setCategorySheetOpen(true)}
              className="group relative flex flex-col items-center justify-center w-full py-1.5 text-center text-muted-foreground hover:text-foreground transition-all duration-300 active:scale-90"
              aria-label="Abrir panel de categorías"
            >
              <div className="grid size-10 place-items-center rounded-2xl transition-all duration-300 hover:bg-white/60 group-hover:scale-105">
                <LayoutGrid className="size-[18px]" />
              </div>
              <span className="text-[10px] tracking-tight leading-tight mt-1">
                Categorías
              </span>
            </button>

            {/* 4. Buscar */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="group relative flex flex-col items-center justify-center w-full py-1.5 text-center text-muted-foreground hover:text-foreground transition-all duration-300 active:scale-90"
              aria-label="Buscar en catálogo"
            >
              <div className="grid size-10 place-items-center rounded-2xl transition-all duration-300 hover:bg-white/60 group-hover:scale-105">
                <Search className="size-[18px]" />
              </div>
              <span className="text-[10px] tracking-tight leading-tight mt-1">
                Buscar
              </span>
            </button>

            {/* 5. Carrito */}
            <button
              type="button"
              onClick={onOpenCart}
              className="group relative flex flex-col items-center justify-center w-full py-1.5 text-center text-muted-foreground hover:text-foreground transition-all duration-300 active:scale-90"
              aria-label={`Abrir carrito con ${cartCount} productos`}
            >
              <div className="relative grid size-10 place-items-center rounded-2xl transition-all duration-300 hover:bg-white/60 group-hover:scale-105">
                <ShoppingCart className="size-[18px] text-brand-deep" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid min-w-4 h-4 px-1 place-items-center rounded-full bg-offer text-[9px] font-black text-offer-foreground animate-cart-pop shadow-md shadow-offer/40">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight leading-tight mt-1 font-medium">
                Carrito
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Apple Liquid Glass: Frosted Category Bottom Sheet */}
      {categorySheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-opacity duration-300 md:hidden"
          onClick={() => setCategorySheetOpen(false)}
        >
          <div
            className="absolute bottom-0 inset-x-0 rounded-t-[36px] liquid-glass-dock p-6 pt-3 shadow-[0_-25px_60px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-400 max-h-[85vh] overflow-y-auto pb-[max(2rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab pill handle */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/30 shadow-xs" />

            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-offer">
                  Apple Liquid Glass 2026
                </p>
                <h3 className="text-xl font-black text-brand-deep">
                  Explorar por Categoría
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCategorySheetOpen(false)}
                className="grid size-9 place-items-center rounded-full bg-white/70 text-muted-foreground border border-white/80 shadow-xs active:scale-90"
                aria-label="Cerrar panel"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat.id];
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className="group relative flex items-center justify-between gap-3.5 p-4 rounded-2xl liquid-glass-card active:scale-[0.98] text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`grid size-12 place-items-center rounded-2xl border shadow-sm transition-transform duration-300 group-hover:scale-110 ${cat.accent}`}
                      >
                        <Icon className="size-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors">
                          {cat.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                    <div className="grid size-8 place-items-center rounded-full bg-white/80 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">
                      <ArrowRight className="size-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-white/60">
              <button
                type="button"
                onClick={() => {
                  setCategorySheetOpen(false);
                  onNavigate("tienda");
                }}
                className="w-full h-12 rounded-2xl bg-primary font-bold text-primary-foreground text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 liquid-glass-button active:scale-98"
              >
                <Store className="size-4" /> Ver Tienda Completa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
