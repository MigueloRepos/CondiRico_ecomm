import React from "react";
import { ShieldCheck, Mail, Phone, Clock, ArrowUpRight } from "lucide-react";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { CategoryId, CategoryInfo } from "@/data/products";

interface FooterProps {
  currentPage: string;
  categories: CategoryInfo[];
  onNavigate: (page: "inicio" | "tienda" | "auth" | "admin", categoryId?: CategoryId) => void;
  onOpenWhatsApp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  onNavigate,
  onOpenWhatsApp,
}) => {
  const currentYear = new Date().getFullYear();

  const handleScrollTo = (id: string) => {
    onNavigate("inicio");
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  return (
    <footer className="bg-[#075B3A] text-white pt-16 pb-28 md:pb-12 border-t border-[#0B7A45]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-white/15">
          
          {/* Col 1: Brand & Description (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <CondiRicoLogo className="h-10 w-auto" light={true} />
            <p className="text-sm text-white/80 leading-relaxed max-w-sm">
              Abastecimiento confiable de alimentos, despensa y materiales de primera necesidad para tu hogar y tu negocio.
            </p>
            {onOpenWhatsApp && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenWhatsApp}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 border border-white/20 transition-all"
                >
                  <WhatsAppIcon className="size-3.5" />
                  <span>Atención directa por WhatsApp</span>
                </button>
              </div>
            )}
          </div>

          {/* Col 2: Navegación (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#FF9D38]">
              Navegación
            </h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("inicio")}
                  className="hover:text-white transition-colors text-left"
                >
                  Inicio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("tienda")}
                  className="hover:text-white transition-colors text-left font-semibold text-white flex items-center gap-1.5"
                >
                  <span>Catálogo de Productos</span>
                  <ArrowUpRight className="size-3 text-[#FF9D38]" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo("categorias")}
                  className="hover:text-white transition-colors text-left"
                >
                  Categorías en Bento
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo("confianza")}
                  className="hover:text-white transition-colors text-left"
                >
                  Nosotros & Calidad
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo("contactos")}
                  className="hover:text-white transition-colors text-left"
                >
                  Contacto & Ubicación
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Categorías Principales (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#FF9D38]">
              Categorías
            </h4>
            <ul className="space-y-2 text-sm text-white/80">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate("tienda", cat.id)}
                    className="hover:text-white transition-colors text-left truncate max-w-full"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Atención & Horarios (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#FF9D38]">
              Atención al Cliente
            </h4>
            <div className="space-y-2 text-sm text-white/80 leading-relaxed">
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-[#FF9D38] shrink-0" />
                <span>Lunes a Domingo, 8:00 – 20:00</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-[#FF9D38] shrink-0" />
                <span>contacto@condirico.com</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-[#FF9D38] shrink-0" />
                <span>+1 800 CONDI RICO</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© {currentYear} CONDIRICO. Todos los derechos reservados.</p>
          
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Acceso Administrativo</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
