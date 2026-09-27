import React, { useState } from "react";
import {
  Search,
  ShoppingCart,
  Store as StoreIcon,
  Fingerprint,
  User as UserIcon,
  ShieldCheck as ShieldCheckIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  UtensilsCrossed,
  ShoppingBasket,
  Sparkles,
  Home,
} from "lucide-react";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { UserProfile } from "@/lib/auth";
import { CategoryId, CategoryInfo } from "@/data/products";

interface HeaderProps {
  currentPage: "inicio" | "tienda" | "auth" | "admin";
  cartCount: number;
  currentUser: UserProfile | null;
  query: string;
  setQuery: (q: string) => void;
  onNavigate: (page: "inicio" | "tienda" | "auth" | "admin", categoryId?: CategoryId) => void;
  onOpenCart: () => void;
  onOpenVoiceSearch: () => void;
  onLogout: () => void;
  categoriesList: CategoryInfo[];
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  cartCount,
  currentUser,
  query,
  setQuery,
  onNavigate,
  onOpenCart,
  onOpenVoiceSearch,
  onLogout,
  categoriesList,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all">
      {/* Specular highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand logo */}
        <a
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("inicio");
          }}
          className="flex shrink-0 items-center transition-transform hover:scale-[1.02] active:scale-98"
          aria-label="CondiRico, inicio"
        >
          <CondiRicoLogo className="h-9 sm:h-11 w-auto" />
        </a>

        {/* Desktop Navigation */}
        <nav className="mx-auto hidden items-center gap-1.5 text-[13px] font-semibold lg:flex p-1 rounded-full border border-white/70 bg-white/50 backdrop-blur-xl shadow-2xs">
          <button
            type="button"
            onClick={() => onNavigate("inicio")}
            className={`px-3.5 py-1.5 rounded-full transition-all duration-300 active:scale-95 ${
              currentPage === "inicio"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-bold scale-[1.02]"
                : "text-foreground hover:bg-white/70 hover:text-primary"
            }`}
          >
            Inicio
          </button>

          <button
            type="button"
            onClick={() => onNavigate("tienda")}
            className={`px-3.5 py-1.5 rounded-full transition-all duration-300 active:scale-95 flex items-center gap-1.5 ${
              currentPage === "tienda"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-bold scale-[1.02]"
                : "text-foreground hover:bg-white/70 hover:text-primary"
            }`}
          >
            <StoreIcon className="size-3.5" />
            <span>Tienda</span>
          </button>

          {/* Categories dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-foreground hover:bg-white/70 hover:text-primary transition-all duration-300 flex items-center gap-1 active:scale-95"
            >
              <span>Categorías</span>
              <ChevronDown className="size-3 text-muted-foreground group-hover:rotate-180 transition-transform duration-300" />
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 rounded-2xl liquid-glass-dock p-2 shadow-2xl border border-white/80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 z-50">
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onNavigate("tienda", cat.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-white/80 hover:text-primary transition-colors text-left"
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] bg-white/80 border border-white/90 px-2 py-0.5 rounded-full shadow-2xs text-muted-foreground">
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (currentPage !== "inicio") {
                onNavigate("inicio");
                setTimeout(() => {
                  document.querySelector("#contactos")?.scrollIntoView({ behavior: "smooth" });
                }, 150);
              } else {
                document.querySelector("#contactos")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="px-3.5 py-1.5 rounded-full text-foreground hover:bg-white/70 hover:text-primary transition-all duration-300 active:scale-95"
          >
            Contactos
          </button>
        </nav>

        {/* Action Tools */}
        <div className="flex items-center justify-end gap-2">
          {/* Quick Search Input */}
          <div className="relative hidden xl:flex items-center">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="h-10 w-56 rounded-full border border-white/80 bg-white/60 pl-9 pr-9 text-xs outline-none backdrop-blur-md transition-all shadow-inner focus:w-64 focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <VoiceSearchButton onClick={onOpenVoiceSearch} ariaLabel="Buscar por voz" />
            </div>
          </div>

          {/* Store Switch */}
          <button
            type="button"
            onClick={() => onNavigate(currentPage === "tienda" ? "inicio" : "tienda")}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold text-primary shadow-xs backdrop-blur-md transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95"
          >
            <StoreIcon className="size-3.5" />
            <span>{currentPage === "tienda" ? "Ver Inicio" : "Abrir Tienda"}</span>
          </button>

          {/* Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative grid size-10 place-items-center rounded-full border border-white/80 bg-white/70 text-brand-deep shadow-xs backdrop-blur-md transition-all duration-300 hover:bg-white hover:scale-105 active:scale-90"
            aria-label={`Carrito con ${cartCount} productos`}
          >
            <ShoppingCart className="size-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-4 h-4 px-1 place-items-center rounded-full bg-offer text-[9px] font-black text-offer-foreground animate-cart-pop shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account Dropdown */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-50/90 pl-1.5 pr-2.5 sm:pr-3 py-1 text-xs font-bold text-emerald-950 shadow-xs backdrop-blur-md transition-all hover:bg-emerald-100/90 active:scale-95"
              >
                <div className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white font-black text-xs shadow-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[85px] truncate">{currentUser.name}</span>
                {currentUser.hasBiometrics && (
                  <Fingerprint className="size-3.5 text-emerald-600 shrink-0" />
                )}
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl liquid-glass-dock p-3 shadow-2xl border border-white/80 animate-in fade-in zoom-in-95 z-50 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1.5 border-b border-white/60 mb-2">
                    <p className="text-xs font-black text-foreground truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{currentUser.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate("auth");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-brand-deep hover:bg-white/80 transition-colors mb-1"
                  >
                    <UserIcon className="size-3.5 text-primary" />
                    <span>Mi Perfil & Preferencias</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate("admin");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors mb-1"
                  >
                    <ShieldCheckIcon className="size-3.5 text-emerald-600" />
                    <span>Panel Administrativo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50/80 transition-colors mt-1"
                  >
                    <LogOut className="size-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate("auth")}
              className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary shadow-xs backdrop-blur-md transition-all hover:bg-primary/20 active:scale-95"
            >
              <UserIcon className="size-3.5" />
              <span className="hidden sm:inline">Ingresar</span>
            </button>
          )}

          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="grid size-10 place-items-center rounded-full border border-white/80 bg-white/70 text-foreground shadow-xs backdrop-blur-md lg:hidden"
            aria-label="Abrir menú de navegación"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
