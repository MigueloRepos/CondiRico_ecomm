import React, { useState } from "react";
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  ShieldCheck as ShieldCheckIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  MessageCircle,
  Fingerprint,
} from "lucide-react";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { UserProfile } from "@/lib/auth";
import { CategoryId, CategoryInfo } from "@/data/products";

interface HeaderProps {
  currentPage: "inicio" | "tienda" | "auth" | "admin";
  cartCount: number;
  favoritesCount: number;
  currentUser: UserProfile | null;
  onNavigate: (page: "inicio" | "tienda" | "auth" | "admin", categoryId?: CategoryId) => void;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenWhatsApp: () => void;
  onLogout: () => void;
  categoriesList?: CategoryInfo[];
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  cartCount,
  favoritesCount,
  currentUser,
  onNavigate,
  onOpenCart,
  onOpenSearch,
  onOpenWhatsApp,
  onLogout,
  categoriesList = [],
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string, page: "inicio" | "tienda" = "inicio") => {
    setMobileMenuOpen(false);
    if (currentPage !== page) {
      onNavigate(page);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5EAE6] transition-all">
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-8">
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("inicio");
            }}
            className="flex shrink-0 items-center transition-opacity hover:opacity-90 active:scale-98"
            aria-label="CondiRico, inicio"
          >
            <CondiRicoLogo className="h-9 sm:h-11 w-auto" />
          </a>

          {/* Center-Left: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-[14px] font-medium text-[#66736D]">
            <button
              type="button"
              onClick={() => onNavigate("inicio")}
              className={`transition-colors hover:text-[#075B3A] ${
                currentPage === "inicio" ? "text-[#075B3A] font-semibold" : ""
              }`}
            >
              Inicio
            </button>

            <button
              type="button"
              onClick={() => onNavigate("tienda")}
              className={`transition-colors hover:text-[#075B3A] ${
                currentPage === "tienda" ? "text-[#075B3A] font-semibold" : ""
              }`}
            >
              Productos
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("categorias")}
              className="transition-colors hover:text-[#075B3A]"
            >
              Categorías
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("confianza")}
              className="transition-colors hover:text-[#075B3A]"
            >
              Nosotros
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("contactos")}
              className="transition-colors hover:text-[#075B3A]"
            >
              Contacto
            </button>
          </nav>
        </div>

        {/* Center-Right: Smart Search Trigger */}
        <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-4">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full h-10 flex items-center justify-between gap-2.5 rounded-full border border-[#E5EAE6] bg-[#F8F7F2] px-4 text-xs text-[#66736D] transition-all hover:border-[#CBD5CE] hover:bg-white hover:shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <Search className="size-4 text-[#66736D] group-hover:text-[#075B3A] transition-colors" />
              <span>Buscar productos...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-[#E5EAE6] bg-white px-1.5 py-0.5 text-[10px] font-mono text-[#66736D]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions: Account, Favorites, Cart & CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="grid size-10 place-items-center rounded-full text-[#12352C] hover:bg-[#F8F7F2] md:hidden transition-colors"
            aria-label="Buscar productos"
          >
            <Search className="size-5" />
          </button>

          {/* User Account Button & Dropdown */}
          <div className="relative">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 h-10 rounded-full border border-[#E5EAE6] bg-white px-3 text-xs font-semibold text-[#12352C] hover:border-[#CBD5CE] transition-all"
              >
                <div className="grid size-6 place-items-center rounded-full bg-[#075B3A] text-white text-[11px] font-bold">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="hidden xl:inline max-w-[90px] truncate">{currentUser.name || "Cuenta"}</span>
                <ChevronDown className="size-3 text-[#66736D]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate("auth")}
                className="grid size-10 place-items-center rounded-full text-[#12352C] hover:bg-[#F8F7F2] transition-colors"
                aria-label="Mi Cuenta"
              >
                <UserIcon className="size-5" />
              </button>
            )}

            {/* User Dropdown */}
            {userDropdownOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#E5EAE6] bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-[#E5EAE6] mb-1">
                  <p className="text-xs font-bold text-[#12352C] truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-[#66736D] truncate">{currentUser.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onNavigate("auth");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#12352C] hover:bg-[#F8F7F2] transition-colors"
                >
                  <UserIcon className="size-4 text-[#075B3A]" />
                  <span>Mi Perfil</span>
                </button>

                {currentUser.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate("admin");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#075B3A] bg-[#F0F6F2] hover:bg-[#E5EFE8] transition-colors my-1"
                  >
                    <ShieldCheckIcon className="size-4" />
                    <span>Panel Administrativo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="size-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>

          {/* Favorites Button */}
          <button
            type="button"
            onClick={() => onNavigate("tienda")}
            className="relative grid size-10 place-items-center rounded-full text-[#12352C] hover:bg-[#F8F7F2] transition-colors hidden sm:grid"
            aria-label="Ver favoritos"
          >
            <Heart className="size-5" />
            {favoritesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-[#F28C28] text-white text-[9px] font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Shopping Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative grid size-10 place-items-center rounded-full text-[#12352C] hover:bg-[#F8F7F2] transition-colors"
            aria-label={`Ver carrito, ${cartCount} productos`}
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-[#075B3A] text-white text-[10px] font-bold animate-cart-pop">
                {cartCount}
              </span>
            )}
          </button>

          {/* CTA: "Contáctanos" (WhatsApp / Consultation) */}
          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#075B3A] hover:bg-[#0B7A45] text-white px-5 py-2.5 text-xs font-bold transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95"
          >
            <WhatsAppIcon className="size-4" />
            <span>Contáctanos</span>
          </button>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid size-10 place-items-center rounded-full border border-[#E5EAE6] text-[#12352C] lg:hidden hover:bg-[#F8F7F2] transition-colors"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E5EAE6] bg-white px-4 py-6 lg:hidden animate-in slide-in-from-top-2 shadow-xl">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate("inicio");
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold text-[#12352C] hover:bg-[#F8F7F2]"
            >
              <span>Inicio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate("tienda");
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold text-[#12352C] hover:bg-[#F8F7F2]"
            >
              <span>Productos</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("categorias")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold text-[#12352C] hover:bg-[#F8F7F2]"
            >
              <span>Categorías</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("confianza")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold text-[#12352C] hover:bg-[#F8F7F2]"
            >
              <span>Nosotros</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("contactos")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold text-[#12352C] hover:bg-[#F8F7F2]"
            >
              <span>Contacto</span>
            </button>

            <div className="pt-3 border-t border-[#E5EAE6] mt-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenWhatsApp();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#075B3A] text-white py-3 text-xs font-bold shadow-sm"
              >
                <WhatsAppIcon className="size-4" />
                <span>Escríbenos por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
