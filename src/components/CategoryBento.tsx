import React from "react";
import {
  ArrowUpRight,
  ShoppingBag,
  UtensilsCrossed,
  ShoppingBasket,
  Sparkles,
  Home as HomeIcon,
  Package,
  Layers,
} from "lucide-react";
import { CategoryId, CategoryInfo, ProductItem } from "@/data/products";
import { CategoryBentoSkeleton } from "@/components/CategoryBentoSkeleton";
import { BlurUpImage } from "@/components/BlurUpImage";

export { CategoryBentoSkeleton };

interface CategoryBentoProps {
  isLoading?: boolean;
  categories?: CategoryInfo[];
  products?: ProductItem[];
  onSelectCategory: (categoryId: CategoryId) => void;
  onExploreAll: () => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  alimentos: UtensilsCrossed,
  "primera-necesidad": ShoppingBasket,
  limpieza: Sparkles,
  utiles: HomeIcon,
};

export const CategoryBento: React.FC<CategoryBentoProps> = ({
  isLoading = false,
  categories = [],
  products = [],
  onSelectCategory,
  onExploreAll,
}) => {
  return (
    <section id="categorias" className="py-12 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#0B7A45] block mb-2">
              Catálogo Editorial
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#12352C] tracking-tight text-balance">
              Todo lo esencial, en un solo lugar
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#66736D] max-w-md font-normal">
              Categorías activas sincronizadas en tiempo real directamente desde Supabase.
            </p>
          </div>

          <button
            type="button"
            onClick={onExploreAll}
            className="self-start sm:self-auto inline-flex items-center gap-2 text-xs font-bold text-[#075B3A] hover:text-[#0B7A45] min-h-[44px] px-4.5 py-2.5 rounded-full border border-[#E5EAE6] bg-white hover:border-[#CBD5CE] transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <span>Ver todas las categorías ({categories.length})</span>
            <ArrowUpRight className="size-4" />
          </button>
        </div>

        {/* Bento Grid Architecture with Skeleton Loader during initial data loading */}
        {isLoading ? (
          <CategoryBentoSkeleton />
        ) : categories.length === 0 ? (
          /* Empty State if no categories in Supabase */
          <div className="rounded-[28px] sm:rounded-3xl border border-[#E5EAE6] bg-white p-8 sm:p-12 text-center shadow-xs">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-[#075B3A] mb-4">
              <Layers className="size-8" />
            </div>
            <h3 className="text-xl font-bold text-[#12352C]">No hay categorías disponibles</h3>
            <p className="text-sm text-[#66736D] mt-2 max-w-md mx-auto">
              Las categorías de la tienda se cargarán en tiempo real cuando estén creadas en la base de datos de Supabase.
            </p>
            <button
              type="button"
              onClick={onExploreAll}
              className="mt-6 inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-full bg-[#075B3A] text-white text-xs font-bold shadow-xs hover:bg-[#0B7A45] transition-all"
            >
              <ShoppingBag className="size-4" />
              <span>Abrir Tienda</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-6 auto-rows-auto sm:auto-rows-[240px]">
            {categories.map((cat, idx) => {
              const Icon = CATEGORY_ICONS[cat.id] || Package;
              
              // Find real products in this category from Supabase
              const catProducts = products.filter((p) => p.category === cat.id);
              const catImage = catProducts.find((p) => Boolean(p.imageUrl))?.imageUrl;
              const productCountText = cat.count || `${catProducts.length} productos`;

              // Dynamic Bento Grid Layout Spans
              const isHero = idx === 0;
              const isMedium = idx === 1 || idx === 2;
              const isWideBanner = idx === 3 && categories.length === 4;

              let gridSpanClass = "sm:col-span-1 lg:col-span-4 lg:row-span-1 min-h-[160px] sm:min-h-0";
              if (isHero) {
                gridSpanClass = "min-h-[260px] sm:min-h-0 sm:col-span-2 lg:col-span-7 lg:row-span-2";
              } else if (isMedium) {
                gridSpanClass = "min-h-[160px] sm:min-h-0 sm:col-span-1 lg:col-span-5 lg:row-span-1";
              } else if (isWideBanner) {
                gridSpanClass = "min-h-[160px] sm:min-h-0 sm:col-span-2 lg:col-span-12 lg:row-span-1";
              }

              if (isHero) {
                // Card 1: Flagship Hero Bento Card with real dynamic category data
                return (
                  <div
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`relative rounded-[28px] sm:rounded-3xl bg-white border border-[#E5EAE6] overflow-hidden p-5 sm:p-8 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-xl hover:border-[#CBD5CE] transition-all duration-300 ${gridSpanClass}`}
                  >
                    {/* Background image & gradient with progressive blur-up */}
                    <div className="absolute inset-0 overflow-hidden">
                      {catImage ? (
                        <BlurUpImage
                          src={catImage}
                          alt={cat.name}
                          priority={true}
                          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="size-full bg-gradient-to-br from-[#12352C] via-[#075B3A] to-[#12352C] opacity-90" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#12352C]/95 via-[#12352C]/50 to-transparent pointer-events-none" />
                    </div>

                    {/* Top Badge & Action */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/90 bg-black/35 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                          {cat.shortName || "Categoría Principal"}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/20">
                          {productCountText}
                        </span>
                      </div>
                      <div className="grid size-11 sm:size-9 place-items-center rounded-full bg-white/90 text-[#12352C] group-hover:bg-[#075B3A] group-hover:text-white transition-all shadow-xs">
                        <ArrowUpRight className="size-4.5 sm:size-4" />
                      </div>
                    </div>

                    {/* Bottom Content */}
                    <div className="relative z-10 text-white">
                      <span className="text-xs font-semibold text-emerald-200 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <Icon className="size-3.5" />
                        <span>{cat.shortName}</span>
                      </span>
                      <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                        {cat.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/80 mt-1.5 max-w-sm line-clamp-2">
                        {cat.description || `Explora todos los productos disponibles en la categoría de ${cat.name}.`}
                      </p>
                    </div>
                  </div>
                );
              }

              if (isWideBanner) {
                // Wide Banner Bento Card (full 12 columns) with dynamic data
                return (
                  <div
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`relative rounded-[28px] sm:rounded-3xl bg-[#12352C] text-white p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group shadow-sm hover:shadow-xl hover:bg-[#075B3A] transition-all duration-300 overflow-hidden ${gridSpanClass}`}
                  >
                    {catImage && (
                      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none overflow-hidden hidden sm:block">
                        <BlurUpImage
                          src={catImage}
                          alt={cat.name}
                          priority={false}
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#12352C] to-transparent" />
                      </div>
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs uppercase tracking-wider font-bold text-emerald-300 flex items-center gap-1.5">
                          <Icon className="size-3.5" />
                          <span>{cat.shortName}</span>
                        </span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/90">
                          {productCountText}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-2xl font-bold text-white">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-white/80 mt-1 max-w-lg">
                        {cat.description || `Suministro de calidad garantizada para ${cat.name}.`}
                      </p>
                    </div>
                    <div className="relative z-10 grid size-11 sm:size-10 place-items-center rounded-full bg-white/10 text-white group-hover:bg-white group-hover:text-[#12352C] transition-all shadow-2xs shrink-0 self-end sm:self-center">
                      <ArrowUpRight className="size-4 sm:size-4" />
                    </div>
                  </div>
                );
              }

              // Standard & Medium dynamic Bento cards
              return (
                <div
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`rounded-[28px] sm:rounded-3xl bg-white border border-[#E5EAE6] p-5 sm:p-6 flex flex-col justify-between cursor-pointer group shadow-xs hover:shadow-lg hover:border-[#CBD5CE] transition-all duration-300 relative overflow-hidden ${gridSpanClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-bold text-[#0B7A45] flex items-center gap-1.5">
                      <Icon className="size-3.5" />
                      <span>{cat.shortName}</span>
                    </span>
                    <div className="grid size-11 sm:size-8 place-items-center rounded-full bg-[#F8F7F2] text-[#12352C] group-hover:bg-[#075B3A] group-hover:text-white transition-all shadow-2xs">
                      <ArrowUpRight className="size-4 sm:size-3.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#12352C] group-hover:text-[#075B3A] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-[#66736D] mt-1 line-clamp-2">
                      {cat.description || `${productCountText} disponibles en catálogo.`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
