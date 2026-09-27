import React from "react";
import { ShieldCheck, Mail, Phone, Clock, Store } from "lucide-react";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import { CategoryId, CategoryInfo } from "@/data/products";

interface FooterProps {
  currentPage: string;
  categories: CategoryInfo[];
  onNavigate: (page: "inicio" | "tienda" | "auth" | "admin", categoryId?: CategoryId) => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentPage,
  categories,
  onNavigate,
}) => {
  return (
    <footer className="border-t border-white/60 bg-brand-deep text-primary-foreground relative z-10 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Brand */}
        <div className="space-y-4">
          <CondiRicoLogo className="h-10 w-auto" light={true} />
          <p className="text-xs leading-6 text-primary-foreground/75 max-w-xs">
            Tu supermercado de confianza, ahora más cerca. Productos de despensa, frescos, aseo personal y artículos para el hogar entregados hoy.
          </p>
        </div>

        {/* Col 2: Navigation */}
        <div>
          <h3 className="font-bold text-sm text-sun uppercase tracking-wider">Explorar</h3>
          <ul className="mt-4 space-y-2.5 text-xs text-primary-foreground/75">
            <li>
              <button
                type="button"
                onClick={() => onNavigate("inicio")}
                className="hover:text-sun transition-colors text-left"
              >
                Página de Inicio
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate("tienda")}
                className="hover:text-sun transition-colors font-bold text-sun text-left"
              >
                Catálogo de Tienda
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onNavigate("tienda", c.id)}
                  className="hover:text-sun transition-colors text-left"
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Help */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-primary-foreground">Ayuda</h3>
          <ul className="mt-4 space-y-2.5 text-xs text-primary-foreground/75">
            <li>Preguntas frecuentes</li>
            <li>Envíos y entregas en 24h</li>
            <li>Garantía y devoluciones</li>
            <li>Términos y condiciones</li>
          </ul>
        </div>

        {/* Col 4: Contact */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-primary-foreground">Contáctanos</h3>
          <p className="mt-4 text-xs leading-6 text-primary-foreground/75 space-y-1">
            <span className="block font-semibold">hola@condirico.com</span>
            <span className="block">+1 800 CONDI RICO</span>
            <span className="block text-primary-foreground/60">Lun–Dom, 8:00–20:00</span>
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-primary-foreground/50 max-w-7xl mx-auto">
        <span>© 2026 CondiRico &bull; Todos los derechos reservados.</span>
        <button
          type="button"
          onClick={() => onNavigate("admin")}
          className="hover:text-emerald-400 font-mono text-[11px] transition-colors flex items-center gap-1.5 text-primary-foreground/60 active:scale-95"
        >
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>Área Administrativa (/admin)</span>
        </button>
      </div>
    </footer>
  );
};
