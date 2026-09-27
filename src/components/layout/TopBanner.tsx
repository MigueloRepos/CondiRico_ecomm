import React from "react";
import { Mail, Phone, Instagram, Twitter } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

interface TopBannerProps {
  onOpenWhatsAppModal: () => void;
}

export const TopBanner: React.FC<TopBannerProps> = ({ onOpenWhatsAppModal }) => {
  return (
    <div className="relative z-50 bg-brand-deep/95 backdrop-blur-md px-4 py-2 text-xs font-semibold text-primary-foreground border-b border-white/10 shadow-xs">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 items-center gap-2 md:gap-6">
        {/* Contact info */}
        <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-sun font-bold hidden lg:inline">
            Contacto directo:
          </span>
          <a
            href="mailto:hola@condirico.com"
            className="inline-flex items-center gap-1.5 text-primary-foreground/90 hover:text-sun transition-colors active:scale-95 group"
            aria-label="Correo de contacto: hola@condirico.com"
          >
            <Mail className="size-3.5 text-sun shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-xs font-medium">hola@condirico.com</span>
          </a>

          <span className="text-white/25 select-none">&bull;</span>

          <a
            href="tel:+18002663474"
            className="inline-flex items-center gap-1.5 text-primary-foreground/90 hover:text-sun transition-colors active:scale-95 group"
            aria-label="Teléfono de contacto: +1 800 CONDI RICO"
          >
            <Phone className="size-3.5 text-sun shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-xs font-medium">+1 800 CONDI RICO</span>
          </a>
        </div>

        {/* Social networks */}
        <div className="flex items-center justify-center md:justify-end gap-3 sm:gap-4 pt-1.5 md:pt-0 border-t border-white/10 md:border-t-0">
          <span className="text-[10px] uppercase tracking-wider text-primary-foreground/60 font-bold hidden sm:inline">
            Síguenos:
          </span>

          <button
            type="button"
            onClick={onOpenWhatsAppModal}
            className="inline-flex items-center gap-1.5 text-primary-foreground/90 hover:text-emerald-400 transition-colors active:scale-95 group cursor-pointer"
            aria-label="Abrir WhatsApp CondiRico"
          >
            <WhatsAppIcon className="size-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-xs font-medium">WhatsApp</span>
          </button>

          <span className="text-white/25 select-none">&bull;</span>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary-foreground/90 hover:text-pink-400 transition-colors active:scale-95 group"
            aria-label="Instagram de CondiRico"
          >
            <Instagram className="size-3.5 text-pink-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-xs font-medium">Instagram</span>
          </a>

          <span className="text-white/25 select-none">&bull;</span>

          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary-foreground/90 hover:text-sky-400 transition-colors active:scale-95 group"
            aria-label="Twitter de CondiRico"
          >
            <Twitter className="size-3.5 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-xs font-medium">Twitter</span>
          </a>
        </div>
      </div>
    </div>
  );
};
