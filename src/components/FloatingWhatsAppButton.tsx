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
    <div className="fixed bottom-20 md:bottom-7 right-4 md:right-7 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-3 shadow-[0_12px_32px_rgba(16,185,129,0.38)] active:scale-95 transition-all duration-300 border border-white/20"
        aria-label="Pedir por WhatsApp"
      >
        <div className="relative">
          <WhatsAppIcon className="size-6 transition-transform duration-300 group-hover:scale-110" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 grid min-w-4 h-4 px-1 place-items-center rounded-full bg-white text-[9px] font-black text-emerald-700 shadow-sm animate-pulse">
              {cartCount}
            </span>
          )}
        </div>
        <span className="hidden sm:inline text-xs font-black tracking-wide">
          {cartCount > 0 ? "Pedir Carrito por WhatsApp" : "Pedir por WhatsApp"}
        </span>
      </button>
    </div>
  );
};
