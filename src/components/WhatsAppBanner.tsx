import React from "react";
import { MessageCircle, ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

interface WhatsAppBannerProps {
  onOpenWhatsApp: () => void;
}

export const WhatsAppBanner: React.FC<WhatsAppBannerProps> = ({ onOpenWhatsApp }) => {
  return (
    <section className="py-14 sm:py-20 bg-[#F0F6F2] border-t border-[#E5EAE6]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white border border-[#CBD5CE] p-8 sm:p-12 lg:p-14 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          
          <div className="max-w-xl">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#0B7A45] block mb-2">
              Atención Inmediata
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#12352C] tracking-tight">
              ¿Deseas cotizar por mayor o hacer un pedido personalizado?
            </h3>
            <p className="mt-2.5 text-sm sm:text-base text-[#66736D] leading-relaxed">
              Comunícate directamente con nuestro equipo por WhatsApp. Te asistimos en tiempo real con disponibilidad, formatos y entregas.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onOpenWhatsApp}
              className="h-13 px-8 rounded-full bg-[#075B3A] hover:bg-[#0B7A45] text-white text-sm font-bold flex items-center gap-3 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              <WhatsAppIcon className="size-5" />
              <span>Escríbenos por WhatsApp</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
