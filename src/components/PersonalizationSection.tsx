import React from "react";
import { Home, Store, UtensilsCrossed, Hammer, ArrowRight } from "lucide-react";
import { CategoryId } from "@/data/products";

interface PersonalizationSectionProps {
  onSelectOption: (categoryId: CategoryId) => void;
}

const SEGMENTS = [
  {
    id: "alimentos" as CategoryId,
    title: "Para mi hogar",
    description: "Despensa completa, granos seleccionados, aceites y alimentos esenciales con entrega en 24h.",
    icon: Home,
    tag: "Despensa Familiar",
  },
  {
    id: "primera-necesidad" as CategoryId,
    title: "Para mi negocio",
    description: "Abastecimiento mayorista continuo, precios competitivos y atención prioritaria para comercios.",
    icon: Store,
    tag: "Venta Mayorista",
  },
  {
    id: "alimentos" as CategoryId,
    title: "Para restaurante",
    description: "Granos, harinas, condimentos y conservas en presentaciones óptimas para cocinas profesionales.",
    icon: UtensilsCrossed,
    tag: "Gastronomía",
  },
  {
    id: "utiles" as CategoryId,
    title: "Para construcción",
    description: "Cemento certificado y útiles indispensables de mantenimiento para obras y proyectos.",
    icon: Hammer,
    tag: "Obras & Reformas",
  },
];

export const PersonalizationSection: React.FC<PersonalizationSectionProps> = ({
  onSelectOption,
}) => {
  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-white border-y border-[#E5EAE6]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#0B7A45] block mb-2">
            Atención Especializada
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#12352C] tracking-tight text-balance">
            ¿Para quién es tu compra?
          </h2>
          <p className="mt-3 text-base text-[#66736D] font-normal">
            Selecciona tu perfil de compra para descubrir la selección y presentaciones ideales para ti.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SEGMENTS.map((segment) => {
            const Icon = segment.icon;
            return (
              <div
                key={segment.title}
                onClick={() => onSelectOption(segment.id)}
                className="group relative rounded-3xl bg-[#F8F7F2] border border-[#E5EAE6] p-6 sm:p-7 flex flex-col justify-between hover:bg-white hover:border-[#CBD5CE] hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="size-12 rounded-2xl bg-white border border-[#E5EAE6] grid place-items-center text-[#075B3A] group-hover:bg-[#075B3A] group-hover:text-white transition-all shadow-2xs">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#66736D] bg-white border border-[#E5EAE6] px-2.5 py-0.5 rounded-full">
                      {segment.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#12352C] group-hover:text-[#075B3A] transition-colors">
                    {segment.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-[#66736D] leading-relaxed">
                    {segment.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E5EAE6] flex items-center justify-between text-xs font-bold text-[#075B3A] group-hover:text-[#0B7A45]">
                  <span>Explorar selección</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
