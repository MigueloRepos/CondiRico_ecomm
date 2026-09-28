import React from "react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

interface FloatingWhatsAppButtonProps {
  onClick: () => void;
  cartCount?: number;
}

export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({
  onClick,
  cartCount = 0,
}) => {
  return (
    <div className="fixed bottom-22 md:bottom-7 right-3.5 md:right-7 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        className="group relative size-12 sm:size-auto flex items-center justify-center sm:gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white sm:px-4 sm:py-3 shadow-[0_10px_28px_rgba(16,185,129,0.38)] active:scale-95 transition-all duration-300 border border-white/30"
        aria-label="Pedir por WhatsApp"
      >
        <div className="relative flex items-center justify-center">
          <WhatsAppIcon className="size-5 sm:size-6 transition-transform duration-300 group-hover:scale-110" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 grid min-w-4 h-4 px-1 place-items-center rounded-full bg-white text-[9px] font-black text-emerald-700 shadow-sm animate-pulse">
              {cartCount}
            </span>
          )}
        </div>
        <span className="hidden sm:inline text-xs font-black tracking-wide whitespace-nowrap">
          {cartCount > 0 ? "Pedir Carrito por WhatsApp" : "Pedir por WhatsApp"}
        </span>
      </button>
    </div>
  );
};
