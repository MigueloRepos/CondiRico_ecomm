import React from "react";
import { ArrowUpRight, Sparkles, ShoppingBag } from "lucide-react";
import { CategoryId } from "@/data/products";
import bentoCannedImg from "@/assets/images/bento_canned_goods_preserves_1790634534320.jpg";

interface CategoryBentoProps {
  onSelectCategory: (categoryId: CategoryId) => void;
  onExploreAll: () => void;
}

export const CategoryBento: React.FC<CategoryBentoProps> = ({
  onSelectCategory,
  onExploreAll,
}) => {
  return (
    <section id="categorias" className="py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#0B7A45] block mb-2">
              Catálogo Editorial
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#12352C] tracking-tight text-balance">
              Todo lo esencial, en un solo lugar
            </h2>
            <p className="mt-2 text-base text-[#66736D] max-w-md font-normal">
              Encuentra fácilmente lo que necesitas.
            </p>
          </div>

          <button
            type="button"
            onClick={onExploreAll}
            className="self-start sm:self-auto inline-flex items-center gap-2 text-xs font-bold text-[#075B3A] hover:text-[#0B7A45] px-4 py-2 rounded-full border border-[#E5EAE6] bg-white hover:border-[#CBD5CE] transition-all"
          >
            <span>Ver todas las categorías</span>
            <ArrowUpRight className="size-3.5" />
          </button>
        </div>

        {/* Bento Grid Architecture */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6 auto-rows-[220px] sm:auto-rows-[240px]">
          
          {/* Card 1: Enlatados Frescos (Hero Large Bento - 7 cols, 2 rows) */}
          <div
            onClick={() => onSelectCategory("alimentos")}
            className="sm:col-span-2 lg:col-span-7 lg:row-span-2 relative rounded-3xl bg-white border border-[#E5EAE6] overflow-hidden p-6 sm:p-8 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-xl hover:border-[#CBD5CE] transition-all duration-300"
          >
            {/* Background image & gradient */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={bentoCannedImg}
                alt="Enlatados y Conservas Frescas"
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12352C]/85 via-[#12352C]/30 to-transparent" />
            </div>

            {/* Top Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/90 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                Selección Destacada
              </span>
              <div className="grid size-9 place-items-center rounded-full bg-white/90 text-[#12352C] group-hover:bg-[#075B3A] group-hover:text-white transition-all">
                <ArrowUpRight className="size-4" />
              </div>
            </div>

            {/* Bottom Content */}
            <div className="relative z-10 text-white">
              <span className="text-xs font-semibold text-emerald-200 uppercase tracking-widest">
                Despensa & Conservas
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
                Enlatados Frescos
              </h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1.5 max-w-sm line-clamp-2">
                Tomates triturados, atún en oliva, frijoles enlatados y conservas de primera selección.
              </p>
            </div>
          </div>

          {/* Card 2: Arroz (Medium Bento - 5 cols, 1 row) */}
          <div
            onClick={() => onSelectCategory("alimentos")}
            className="sm:col-span-1 lg:col-span-5 lg:row-span-1 rounded-3xl bg-white border border-[#E5EAE6] p-6 flex flex-col justify-between cursor-pointer group shadow-xs hover:shadow-lg hover:border-[#CBD5CE] transition-all duration-300 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-[#0B7A45]">
                Granos Selectos
              </span>
              <div className="grid size-8 place-items-center rounded-full bg-[#F8F7F2] text-[#12352C] group-hover:bg-[#075B3A] group-hover:text-white transition-all">
                <ArrowUpRight className="size-3.5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#12352C] group-hover:text-[#075B3A] transition-colors">
                Arroz Premium
              </h3>
              <p className="text-xs text-[#66736D] mt-1">
                Grano largo seleccionado en presentaciones para hogar y negocio.
              </p>
            </div>
          </div>

          {/* Card 3: Azúcar (Medium Bento - 5 cols, 1 row) */}
          <div
            onClick={() => onSelectCategory("primera-necesidad")}
            className="sm:col-span-1 lg:col-span-5 lg:row-span-1 rounded-3xl bg-white border border-[#E5EAE6] p-6 flex flex-col justify-between cursor-pointer group shadow-xs hover:shadow-lg hover:border-[#CBD5CE] transition-all duration-300 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-[#0B7A45]">
                Básicos Esenciales
              </span>
              <div className="grid size-8 place-items-center rounded-full bg-[#F8F7F2] text-[#12352C] group-hover:bg-[#075B3A] group-hover:text-white transition-all">
                <ArrowUpRight className="size-3.5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#12352C] group-hover:text-[#075B3A] transition-colors">
                Azúcar Blanca & Morena
              </h3>
              <p className="text-xs text-[#66736D] mt-1">
                Pureza de caña y presentaciones mayoristas de alta calidad.
              </p>
            </div>
          </div>

          {/* Card 4: Frijoles (Compact Bento - 4 cols, 1 row) */}
          <div
            onClick={() => onSelectCategory("alimentos")}
            className="sm:col-span-1 lg:col-span-4 lg:row-span-1 rounded-3xl bg-white border border-[#E5EAE6] p-6 flex flex-col justify-between cursor-pointer group shadow-xs hover:shadow-lg hover:border-[#CBD5CE] transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-[#66736D]">
                Legumbres
              </span>
              <div className="grid size-8 place-items-center rounded-full bg-[#F8F7F2] text-[#12352C] group-hover:bg-[#075B3A] group-hover:text-white transition-all">
                <ArrowUpRight className="size-3.5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#12352C] group-hover:text-[#075B3A] transition-colors">
                Frijoles & Lentejas
              </h3>
              <p className="text-xs text-[#66736D] mt-1">
                Negros, rojos y pardinas al vacío.
              </p>
            </div>
          </div>

          {/* Card 5: Harina de Trigo (Compact Bento - 4 cols, 1 row) */}
          <div
            onClick={() => onSelectCategory("primera-necesidad")}
            className="sm:col-span-1 lg:col-span-4 lg:row-span-1 rounded-3xl bg-white border border-[#E5EAE6] p-6 flex flex-col justify-between cursor-pointer group shadow-xs hover:shadow-lg hover:border-[#CBD5CE] transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-[#66736D]">
                Repostería & Cocina
              </span>
              <div className="grid size-8 place-items-center rounded-full bg-[#F8F7F2] text-[#12352C] group-hover:bg-[#075B3A] group-hover:text-white transition-all">
                <ArrowUpRight className="size-3.5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#12352C] group-hover:text-[#075B3A] transition-colors">
                Harina de Trigo
              </h3>
              <p className="text-xs text-[#66736D] mt-1">
                Tradicional y repostera de fuerza.
              </p>
            </div>
          </div>

          {/* Card 6: Cemento & Materiales (Wide Bento - 4 cols, 1 row) */}
          <div
            onClick={() => onSelectCategory("utiles")}
            className="sm:col-span-2 lg:col-span-4 lg:row-span-1 rounded-3xl bg-[#12352C] text-white p-6 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-xl hover:bg-[#075B3A] transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-300">
                Construcción & Hogar
              </span>
              <div className="grid size-8 place-items-center rounded-full bg-white/10 text-white group-hover:bg-white group-hover:text-[#12352C] transition-all">
                <ArrowUpRight className="size-3.5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Cemento & Suministros
              </h3>
              <p className="text-xs text-white/80 mt-1">
                Materiales certificados para obras y remodelaciones.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
