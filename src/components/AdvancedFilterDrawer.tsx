import React from "react";
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Star,
  Tag,
  Heart,
  Check,
  UtensilsCrossed,
  ShoppingBasket,
  Sparkles,
  Home as HomeIcon,
  ArrowUpDown,
} from "lucide-react";
import { CATEGORIES, CategoryId, CategoryInfo } from "@/data/products";

export type SortOption =
  | "default"
  | "price-asc"
  | "price-desc"
  | "rating-desc"
  | "name-asc";

export interface FilterState {
  minPrice: number;
  maxPrice: number;
  selectedCategories: CategoryId[];
  onlyOffers: boolean;
  minRating: number; // 0 for all, 4 for 4+ stars, 4.8 for 4.8+
  onlyFavorites: boolean;
  sortBy: SortOption;
}

interface AdvancedFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  totalAvailable: number;
  matchedCount: number;
  absoluteMinPrice: number;
  absoluteMaxPrice: number;
  hasFavorites: boolean;
  categoriesList?: CategoryInfo[];
}

const CATEGORY_ICONS: Record<CategoryId, React.ElementType> = {
  alimentos: UtensilsCrossed,
  "primera-necesidad": ShoppingBasket,
  limpieza: Sparkles,
  utiles: HomeIcon,
};

export const AdvancedFilterDrawer: React.FC<AdvancedFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onResetFilters,
  matchedCount,
  absoluteMinPrice,
  absoluteMaxPrice,
  hasFavorites,
  categoriesList = CATEGORIES,
}) => {
  if (!isOpen) return null;

  const handleCategoryToggle = (catId: CategoryId) => {
    const exists = filters.selectedCategories.includes(catId);
    let updated: CategoryId[];
    if (exists) {
      updated = filters.selectedCategories.filter((id) => id !== catId);
    } else {
      updated = [...filters.selectedCategories, catId];
    }
    onFiltersChange({ ...filters, selectedCategories: updated });
  };

  const handleSelectAllCategories = () => {
    if (filters.selectedCategories.length === categoriesList.length) {
      onFiltersChange({ ...filters, selectedCategories: [] });
    } else {
      onFiltersChange({
        ...filters,
        selectedCategories: categoriesList.map((c) => c.id),
      });
    }
  };

  const handlePricePreset = (min: number, max: number) => {
    onFiltersChange({
      ...filters,
      minPrice: min,
      maxPrice: max,
    });
  };

  const isPriceFiltered =
    filters.minPrice > absoluteMinPrice || filters.maxPrice < absoluteMaxPrice;
  const isCategoriesFiltered =
    filters.selectedCategories.length > 0 &&
    filters.selectedCategories.length < CATEGORIES.length;
  const isExtrasFiltered =
    filters.onlyOffers || filters.minRating > 0 || filters.onlyFavorites;
  const isSortFiltered = filters.sortBy !== "default";

  const activeFiltersCount =
    (isPriceFiltered ? 1 : 0) +
    (isCategoriesFiltered ? 1 : 0) +
    (filters.onlyOffers ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.onlyFavorites ? 1 : 0) +
    (isSortFiltered ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md transition-opacity duration-300 flex justify-end"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md sm:max-w-lg h-full bg-white/95 backdrop-blur-2xl border-l border-white/80 shadow-[0_0_50px_rgba(0,0,0,0.18)] flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular glass highlight line at the top */}
        <div className="absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        {/* Drawer Header */}
        <div className="p-6 pb-4 border-b border-border/60 flex items-center justify-between shrink-0 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-brand-deep tracking-tight">
                  Filtros Avanzados
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="grid min-w-5 h-5 px-1.5 place-items-center rounded-full bg-offer text-offer-foreground text-[10px] font-black shadow-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Personaliza precio, categorías y características
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                title="Restablecer filtros"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-90 transition-all"
              aria-label="Cerrar panel de filtros"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body: Scrollable Filters */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7 [scrollbar-width:thin]">
          {/* 1. Categorías Específicas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-brand-deep flex items-center gap-1.5">
                <span>Categorías Específicas</span>
                {filters.selectedCategories.length > 0 && (
                  <span className="text-[11px] font-normal text-muted-foreground">
                    ({filters.selectedCategories.length} seleccionadas)
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={handleSelectAllCategories}
                className="text-xs font-bold text-primary hover:underline"
              >
                {filters.selectedCategories.length === categoriesList.length
                  ? "Deseleccionar todas"
                  : "Todas las categorías"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categoriesList.map((cat) => {
                const Icon = (CATEGORY_ICONS as Record<string, React.ElementType>)[cat.id] || UtensilsCrossed;
                const isSelected =
                  filters.selectedCategories.length === 0 ||
                  filters.selectedCategories.includes(cat.id);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                      isSelected
                        ? "bg-primary/5 border-primary/40 shadow-xs"
                        : "bg-muted/30 border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`grid size-8 place-items-center rounded-xl border text-xs shrink-0 ${cat.accent}`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {cat.shortName}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {cat.count}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`grid size-5 place-items-center rounded-md border text-xs shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Rango de Precios */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-brand-deep">
                Rango de Precio
              </label>
              <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                ${filters.minPrice.toFixed(2)} – ${filters.maxPrice.toFixed(2)}
              </span>
            </div>

            {/* Quick Price Presets */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                { label: "Todos", min: absoluteMinPrice, max: absoluteMaxPrice },
                { label: "< $3.00", min: absoluteMinPrice, max: 3 },
                { label: "$3.00 - $6.00", min: 3, max: 6 },
                { label: "$6.00 - $10.00", min: 6, max: 10 },
                { label: "> $10.00", min: 10, max: absoluteMaxPrice },
              ].map((preset) => {
                const isActive =
                  filters.minPrice === preset.min &&
                  filters.maxPrice === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePricePreset(preset.min, preset.max)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Dual Inputs */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Mínimo
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    min={absoluteMinPrice}
                    max={filters.maxPrice}
                    step="0.5"
                    value={filters.minPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val) && val >= 0) {
                        onFiltersChange({
                          ...filters,
                          minPrice: Math.min(val, filters.maxPrice),
                        });
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-border/80 bg-white/80 pl-7 pr-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Máximo
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    min={filters.minPrice}
                    max={absoluteMaxPrice}
                    step="0.5"
                    value={filters.maxPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val)) {
                        onFiltersChange({
                          ...filters,
                          maxPrice: Math.max(val, filters.minPrice),
                        });
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-border/80 bg-white/80 pl-7 pr-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Sliders for Price */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Límite superior: ${filters.maxPrice.toFixed(2)}</span>
                <span>Máx cat: ${absoluteMaxPrice.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={absoluteMinPrice}
                max={absoluteMaxPrice}
                step="0.25"
                value={filters.maxPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onFiltersChange({
                    ...filters,
                    maxPrice: Math.max(val, filters.minPrice),
                  });
                }}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* 3. Ordenamiento */}
          <div className="pt-2 border-t border-border/50">
            <label className="text-xs font-extrabold uppercase tracking-wider text-brand-deep block mb-2.5 flex items-center gap-1.5">
              <ArrowUpDown className="size-3.5 text-primary" />
              <span>Ordenar Productos Por</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "default", label: "Recomendados" },
                { id: "price-asc", label: "Precio: Menor a Mayor" },
                { id: "price-desc", label: "Precio: Mayor a Menor" },
                { id: "rating-desc", label: "Mayor Calificación" },
                { id: "name-asc", label: "Nombre: A - Z" },
              ].map((opt) => {
                const isSelected = filters.sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        sortBy: opt.id as SortOption,
                      })
                    }
                    className={`rounded-xl px-3 py-2 text-xs font-bold text-left transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Filtros Especiales / Características */}
          <div className="pt-2 border-t border-border/50 space-y-2.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-brand-deep block mb-2">
              Filtros Especiales
            </label>

            {/* Solo en Oferta */}
            <label className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-xl bg-offer/15 text-offer">
                  <Tag className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Solo productos en oferta
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Descuentos semanales y precios rebajados
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={filters.onlyOffers}
                onChange={(e) =>
                  onFiltersChange({ ...filters, onlyOffers: e.target.checked })
                }
                className="size-4 rounded accent-offer cursor-pointer"
              />
            </label>

            {/* Mejor Valorados */}
            <label className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-600">
                  <Star className="size-4 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Alta valoración (4.8★ o más)
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Productos favoritos por los clientes
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={filters.minRating >= 4.8}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minRating: e.target.checked ? 4.8 : 0,
                  })
                }
                className="size-4 rounded accent-primary cursor-pointer"
              />
            </label>

            {/* Solo Favoritos */}
            {hasFavorites && (
              <label className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-8 place-items-center rounded-xl bg-rose-100 text-rose-600">
                    <Heart className="size-4 fill-current" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Solo mis favoritos
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Productos que guardaste con el corazón
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={filters.onlyFavorites}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      onlyFavorites: e.target.checked,
                    })
                  }
                  className="size-4 rounded accent-rose-600 cursor-pointer"
                />
              </label>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-border/60 bg-white/80 backdrop-blur-md flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetFilters}
            className="flex-1 h-12 rounded-full border border-border bg-white text-xs font-bold text-foreground hover:bg-muted transition-colors active:scale-95"
          >
            Limpiar todo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-[2] h-12 rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 liquid-glass-button active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Ver {matchedCount} {matchedCount === 1 ? "producto" : "productos"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
