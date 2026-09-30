import React from "react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

interface FloatingWhatsAppButtonProps {
  onClick: () => void;
  cartCount?: number;
}

export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({
  onClick,
}) => {
  return (
    <div className="fixed bottom-22 md:bottom-7 right-3.5 md:right-7 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        className="group relative flex items-center justify-center gap-2 sm:gap-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-3 sm:px-4.5 sm:py-3 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 border border-white/30 cursor-pointer"
        aria-label="¿Tienes dudas? Escríbenos por WhatsApp"
      >
        <WhatsAppIcon className="size-5 sm:size-6 transition-transform duration-300 group-hover:scale-110 shrink-0" />
        <span className="hidden sm:inline text-xs font-bold tracking-wide whitespace-nowrap">
          ¿Tienes dudas? Escríbenos
        </span>
      </button>
    </div>
  );
};
