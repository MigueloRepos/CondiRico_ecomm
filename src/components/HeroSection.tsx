import React from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Truck, Headphones, Sparkles } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import heroEditorialImg from "@/assets/images/editorial_hero_pantry_wholesale_1790634524803.jpg";

interface HeroSectionProps {
  onOpenWhatsApp: () => void;
  onExploreProducts: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenWhatsApp,
  onExploreProducts,
}) => {
  return (
    <section className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Hero Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#0B7A45]">
              <span className="size-1.5 rounded-full bg-[#0B7A45]" />
              <span>Calidad · Frescura · Confianza</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#12352C] leading-[1.08] text-balance">
              Todo lo que necesitas.{" "}
              <span className="text-[#0B7A45] block">En un solo lugar.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#66736D] max-w-lg leading-relaxed font-normal">
              Productos frescos, enlatados y de primera necesidad para tu hogar y tu negocio.
            </p>

            {/* Action CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Primary CTA */}
              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="h-12 px-7 rounded-full bg-[#075B3A] hover:bg-[#0B7A45] text-white text-sm font-bold flex items-center gap-2.5 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
              >
                <WhatsAppIcon className="size-4" />
                <span>Solicitar información</span>
              </button>

              {/* Secondary CTA */}
              <button
                type="button"
                onClick={onExploreProducts}
                className="h-12 px-7 rounded-full bg-white hover:bg-[#F8F7F2] text-[#12352C] border border-[#E5EAE6] text-sm font-semibold flex items-center gap-2 transition-all hover:border-[#CBD5CE] active:scale-95"
              >
                <span>Ver productos</span>
                <ArrowRight className="size-4 text-[#66736D]" />
              </button>
            </div>
          </div>

          {/* Right Image Showcase Column */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] w-full rounded-3xl overflow-hidden bg-white border border-[#E5EAE6] shadow-xl group">
              <img
                src={heroEditorialImg}
                alt="Abastecimiento de alimentos y productos esenciales CondiRico"
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                loading="eager"
              />
              
              {/* Subtle Ambient Reflection Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#12352C]/30 via-transparent to-transparent pointer-events-none" />
              
              {/* Floating Editorial Label Tag */}
              <div className="absolute bottom-5 left-5 right-5 sm:right-auto bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#E5EAE6] shadow-sm flex items-center gap-3">
                <div className="size-8 rounded-xl bg-[#F0F6F2] grid place-items-center text-[#075B3A] shrink-0 font-bold text-xs">
                  CR
                </div>
                <div>
                  <p className="text-xs font-bold text-[#12352C] leading-none">
                    Abastecimiento Integral
                  </p>
                  <p className="text-[11px] text-[#66736D] mt-0.5">
                    Alimentos, despensa y materiales
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators (Directly Below Hero) */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-[#E5EAE6]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-white border border-[#E5EAE6] grid place-items-center text-[#075B3A] shrink-0 shadow-2xs">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#12352C]">
                  Calidad seleccionada
                </h4>
                <p className="text-xs text-[#66736D] mt-0.5">
                  Estándares rigurosos de frescura y empaque
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-white border border-[#E5EAE6] grid place-items-center text-[#075B3A] shrink-0 shadow-2xs">
                <Truck className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#12352C]">
                  Abastecimiento confiable
                </h4>
                <p className="text-xs text-[#66736D] mt-0.5">
                  Logística coordinada directo a tu puerta
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-white border border-[#E5EAE6] grid place-items-center text-[#075B3A] shrink-0 shadow-2xs">
                <Headphones className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#12352C]">
                  Atención personalizada
                </h4>
                <p className="text-xs text-[#66736D] mt-0.5">
                  Asesoría directa para pedidos y cotizaciones
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
