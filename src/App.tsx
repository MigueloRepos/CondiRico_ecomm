import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  Clock,
  Clock3,
  Heart,
  Home,
  Instagram,
  Leaf,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  Quote,
  Search,
  Send,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Star,
  Store as StoreIcon,
  Truck,
  Twitter,
  UtensilsCrossed,
  X,
  Sparkle,
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import { ThumbBottomNav } from "@/components/ThumbBottomNav";
import { ThumbSearchModal } from "@/components/ThumbSearchModal";
import { StorePage } from "@/components/StorePage";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { WhatsAppOrderModal } from "@/components/WhatsAppOrderModal";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";
import {
  CATEGORIES,
  ALL_PRODUCTS,
  CategoryId,
  ProductItem,
} from "@/data/products";
import heroImage from "@/assets/condirico-hero.jpg";
import productsImage from "@/assets/condirico-products.jpg";
import promoImage from "@/assets/condirico-promo.jpg";

const categoryIconMap = {
  alimentos: UtensilsCrossed,
  "primera-necesidad": ShoppingBasket,
  limpieza: Sparkles,
  utiles: Home,
};

const benefits = [
  { icon: Truck, title: "Envíos rápidos", text: "Recibe hoy mismo en tu puerta" },
  { icon: ShieldCheck, title: "Compra segura", text: "Tus datos 100% protegidos" },
  { icon: PackageCheck, title: "Calidad garantizada", text: "Alimentos y útiles certificados" },
  { icon: Clock3, title: "Siempre contigo", text: "Atención todos los días del año" },
  { icon: Leaf, title: "Selección fresca", text: "Lo mejor para cuidar tu hogar" },
];

function Brand({
  light = false,
  onClick,
}: {
  light?: boolean;
  onClick?: () => void;
}) {
  return (
    <a
      href="#inicio"
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex shrink-0 items-center transition-transform hover:scale-[1.02] active:scale-98"
      aria-label="CondiRico, inicio"
    >
      <CondiRicoLogo className="h-9 sm:h-11 w-auto" light={light} />
    </a>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<"inicio" | "tienda">("inicio");
  const [targetCategory, setTargetCategory] = useState<CategoryId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [cart, setCart] = useState<Record<number, number>>({
    1: 1, // Pre-seeded with 1 item for interactive showcase
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "Consulta sobre un pedido",
    message: "",
  });
  const productRail = useRef<HTMLDivElement>(null);
  const testimonialRail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#tienda")) {
        setCurrentPage("tienda");
        if (hash.includes("alimentos")) setTargetCategory("alimentos");
        else if (hash.includes("necesidad")) setTargetCategory("primera-necesidad");
        else if (hash.includes("limpieza")) setTargetCategory("limpieza");
        else if (hash.includes("utiles")) setTargetCategory("utiles");
      } else if (hash === "#inicio" || hash === "") {
        setCurrentPage("inicio");
      }
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const cartCount = Object.values(cart).reduce((sum, amount) => sum + amount, 0);
  const cartTotal = ALL_PRODUCTS.reduce(
    (sum, product) => sum + product.price * (cart[product.id] ?? 0),
    0
  );

  const featuredProducts = useMemo(() => {
    const base = ALL_PRODUCTS.filter((p) => p.isPopular || p.pos);
    if (!query) return base;
    return ALL_PRODUCTS.filter((product) =>
      `${product.name} ${product.detail} ${product.category}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [query]);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: number) =>
    ref.current?.scrollBy({ left: direction * 340, behavior: "smooth" });

  const toggleFavorite = (id: number) =>
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const changeCart = (id: number, amount: number) =>
    setCart((current) => {
      const next = Math.max(0, (current[id] ?? 0) + amount);
      const updated = { ...current, [id]: next };
      if (!next) delete updated[id];
      return updated;
    });

  const navigateTo = (page: "inicio" | "tienda", categoryId?: CategoryId) => {
    setCurrentPage(page);
    setMenuOpen(false);
    if (page === "tienda") {
      setTargetCategory(categoryId || null);
      window.location.hash = categoryId ? `#tienda-${categoryId}` : "#tienda";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.hash = "#inicio";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div id="inicio" className="relative min-h-screen bg-background text-foreground flex flex-col selection:bg-sun selection:text-brand-deep">
      {/* Volumetric Ambient Lighting Layers */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[550px] w-[550px] rounded-full bg-emerald-200/20 blur-[130px] animate-float-slow" />
        <div className="absolute top-1/2 -left-32 h-[500px] w-[500px] rounded-full bg-amber-100/30 blur-[120px] animate-float-reverse" />
        <div className="absolute bottom-10 right-10 h-[480px] w-[480px] rounded-full bg-teal-100/25 blur-[140px] animate-float-slow" />
      </div>

      {/* Top Banner (Apple Liquid Pill) */}
      <div className="relative z-50 bg-brand-deep/95 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-primary-foreground border-b border-white/10 shadow-xs">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-y-1 gap-x-4">
          {/* Lado izquierdo: Correo de contacto y Número de contacto */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <a
              href="mailto:hola@condirico.com"
              className="inline-flex items-center gap-1.5 text-primary-foreground/90 hover:text-sun transition-colors active:scale-95"
              aria-label="Correo de contacto: hola@condirico.com"
            >
              <Mail className="size-3.5 text-sun shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium">hola@condirico.com</span>
            </a>

            <span className="text-white/30 hidden xs:inline">•</span>

            <a
              href="tel:+18002663474"
              className="inline-flex items-center gap-1.5 text-primary-foreground/90 hover:text-sun transition-colors active:scale-95"
              aria-label="Teléfono de contacto: +1 800 CONDI RICO"
            >
              <Phone className="size-3.5 text-sun shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium">+1 800 CONDI RICO</span>
            </a>
          </div>

          {/* Lado derecho: Redes sociales WhatsApp, Instagram, Twitter */}
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden md:inline text-[11px] text-primary-foreground/60 font-normal">
              Síguenos:
            </span>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => setWhatsAppModalOpen(true)}
              className="inline-flex items-center gap-1 text-primary-foreground/90 hover:text-emerald-400 transition-colors active:scale-95"
              aria-label="Abrir WhatsApp CondiRico"
            >
              <WhatsAppIcon className="size-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium">WhatsApp</span>
            </button>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary-foreground/90 hover:text-pink-400 transition-colors active:scale-95"
              aria-label="Instagram de CondiRico"
            >
              <Instagram className="size-3.5 text-pink-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium">Instagram</span>
            </a>

            {/* Twitter */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary-foreground/90 hover:text-sky-400 transition-colors active:scale-95"
              aria-label="Twitter de CondiRico"
            >
              <Twitter className="size-3.5 text-sky-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium">Twitter</span>
            </a>
          </div>
        </div>
      </div>

      {/* Apple Liquid Glass 2026 Header */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all">
        {/* Top specular highlight line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Brand onClick={() => navigateTo("inicio")} />

          {/* Desktop Navigation with Magnetic Glass Pill Indicator */}
          <nav className="mx-auto hidden items-center gap-1.5 text-[13px] font-semibold lg:flex p-1 rounded-full border border-white/70 bg-white/50 backdrop-blur-xl shadow-2xs">
            {/* 1. Inicio */}
            <button
              type="button"
              onClick={() => navigateTo("inicio")}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-300 active:scale-95 ${
                currentPage === "inicio"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-bold scale-[1.02]"
                  : "text-foreground hover:bg-white/70 hover:text-primary"
              }`}
            >
              Inicio
            </button>

            {/* 2. Productos */}
            <button
              type="button"
              onClick={() => {
                if (currentPage !== "inicio") {
                  navigateTo("inicio");
                  setTimeout(() => {
                    document.querySelector("#destacados")?.scrollIntoView({ behavior: "smooth" });
                  }, 150);
                } else {
                  document.querySelector("#destacados")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="px-3.5 py-1.5 rounded-full text-foreground hover:bg-white/70 hover:text-primary transition-all duration-300 active:scale-95"
            >
              Productos
            </button>

            {/* 3. Categorías */}
            <button
              type="button"
              onClick={() => {
                if (currentPage !== "inicio") {
                  navigateTo("inicio");
                  setTimeout(() => {
                    document.querySelector("#categorias")?.scrollIntoView({ behavior: "smooth" });
                  }, 150);
                } else {
                  document.querySelector("#categorias")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="px-3.5 py-1.5 rounded-full text-foreground hover:bg-white/70 hover:text-primary transition-all duration-300 active:scale-95"
            >
              Categorías
            </button>

            {/* 4. Ofertas */}
            <button
              type="button"
              onClick={() => {
                if (currentPage !== "inicio") {
                  navigateTo("inicio");
                  setTimeout(() => {
                    document.querySelector("#ofertas")?.scrollIntoView({ behavior: "smooth" });
                  }, 150);
                } else {
                  document.querySelector("#ofertas")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-foreground hover:bg-white/70 hover:text-primary transition-all duration-300 active:scale-95"
            >
              Ofertas <ChevronDown className="size-3" />
            </button>

            {/* 5. Tienda */}
            <button
              type="button"
              onClick={() => navigateTo("tienda")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-300 active:scale-95 ${
                currentPage === "tienda"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-bold scale-[1.02]"
                  : "text-foreground hover:bg-white/70 hover:text-primary"
              }`}
            >
              <StoreIcon className="size-3.5" />
              <span>Tienda</span>
            </button>

            {/* 6. Contactos */}
            <button
              type="button"
              onClick={() => {
                if (currentPage !== "inicio") {
                  navigateTo("inicio");
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

          {/* Header Action Tools */}
          <div className="flex items-center justify-end gap-2">
            {/* Desktop quick search with liquid glass styling */}
            <label className="relative hidden xl:block">
              <span className="sr-only">Buscar productos</span>
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar productos..."
                className="h-10 w-56 rounded-full border border-white/80 bg-white/60 pl-9 pr-3 text-xs outline-none backdrop-blur-md transition-all shadow-inner focus:w-64 focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {/* Direct switch to Tienda on desktop */}
            <button
              type="button"
              onClick={() => navigateTo(currentPage === "tienda" ? "inicio" : "tienda")}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold text-primary shadow-xs backdrop-blur-md transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95"
            >
              <StoreIcon className="size-3.5" />
              <span>{currentPage === "tienda" ? "Ver Inicio" : "Abrir Tienda"}</span>
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
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

            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-white/80 bg-white/70 text-foreground lg:hidden shadow-xs backdrop-blur-md active:scale-90"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Abrir menú"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Frosted Glass Sheet) */}
        {menuOpen && (
          <nav className="border-t border-white/60 bg-white/85 px-4 py-5 backdrop-blur-2xl lg:hidden animate-in slide-in-from-top-2 shadow-2xl">
            <div className="mx-auto grid max-w-7xl gap-2">
              <button
                type="button"
                onClick={() => navigateTo("inicio")}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-bold flex items-center justify-between transition-all ${
                  currentPage === "inicio"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "hover:bg-white/80"
                }`}
              >
                <span>Inicio</span>
                {currentPage === "inicio" && <span className="text-xs">Activo</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (currentPage !== "inicio") {
                    navigateTo("inicio");
                    setTimeout(() => {
                      document.querySelector("#destacados")?.scrollIntoView({ behavior: "smooth" });
                    }, 150);
                  } else {
                    document.querySelector("#destacados")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="rounded-2xl px-4 py-3 text-left text-sm font-bold flex items-center justify-between hover:bg-white/80"
              >
                <span>Productos Destacados</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (currentPage !== "inicio") {
                    navigateTo("inicio");
                    setTimeout(() => {
                      document.querySelector("#categorias")?.scrollIntoView({ behavior: "smooth" });
                    }, 150);
                  } else {
                    document.querySelector("#categorias")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="rounded-2xl px-4 py-3 text-left text-sm font-bold flex items-center justify-between hover:bg-white/80"
              >
                <span>Categorías</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (currentPage !== "inicio") {
                    navigateTo("inicio");
                    setTimeout(() => {
                      document.querySelector("#ofertas")?.scrollIntoView({ behavior: "smooth" });
                    }, 150);
                  } else {
                    document.querySelector("#ofertas")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="rounded-2xl px-4 py-3 text-left text-sm font-bold flex items-center justify-between hover:bg-white/80"
              >
                <span>Ofertas de la Semana</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo("tienda")}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-bold flex items-center justify-between transition-all ${
                  currentPage === "tienda"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "hover:bg-white/80 text-primary"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <StoreIcon className="size-4" />
                  <span>Tienda Completa</span>
                </div>
                <span className="rounded-full bg-offer text-offer-foreground px-2 py-0.5 text-[10px] font-black">
                  Catálogo
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (currentPage !== "inicio") {
                    navigateTo("inicio");
                    setTimeout(() => {
                      document.querySelector("#contactos")?.scrollIntoView({ behavior: "smooth" });
                    }, 150);
                  } else {
                    document.querySelector("#contactos")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="rounded-2xl px-4 py-3 text-left text-sm font-bold flex items-center justify-between hover:bg-white/80"
              >
                <span>Contactos</span>
              </button>

              <div className="my-1 border-t border-white/60 pt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3">
                Secciones por Categoría
              </div>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => navigateTo("tienda", cat.id)}
                  className="rounded-xl px-4 py-2.5 text-left text-xs font-semibold hover:bg-white/70 flex items-center justify-between text-muted-foreground hover:text-foreground"
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] bg-white/80 border border-white/90 px-2 py-0.5 rounded-full shadow-2xs">
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === "tienda" ? (
          <StorePage
            initialCategory={targetCategory}
            cart={cart}
            onAddToCart={changeCart}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onOpenCart={() => setCartOpen(true)}
            onOpenWhatsAppOrder={() => setWhatsAppModalOpen(true)}
          />
        ) : (
          <div>
            {/* Hero Section: Apple Liquid Glass 2026 */}
            <section className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16">
              <div className="mx-auto grid max-w-[1536px] lg:grid-cols-2 gap-8 items-center px-4 sm:px-6 lg:px-12">
                <div className="w-full max-w-xl animate-rise">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-primary shadow-xs backdrop-blur-md">
                    <Sparkle className="size-3.5 text-offer animate-pulse" />
                    <span>Tu supermercado de confianza</span>
                  </div>

                  <h1 className="text-4xl font-black leading-[1.07] tracking-tight text-brand-deep sm:text-5xl lg:text-6xl">
                    Todo lo que necesitas
                    <br />
                    <span className="text-offer">en un solo lugar</span>
                  </h1>

                  <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
                    Productos frescos, despensa completa, limpieza y artículos
                    del hogar con entrega garantizada en 24 horas.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5">
                    <button
                      type="button"
                      onClick={() => navigateTo("tienda")}
                      className="h-13 rounded-full bg-offer px-8 font-black text-offer-foreground text-sm flex items-center gap-2.5 shadow-xl shadow-offer/30 liquid-glass-button active:scale-95"
                    >
                      <span>Explorar la Tienda</span>
                      <ArrowRight className="size-4" />
                    </button>
                    <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <span className="size-2 rounded-full bg-primary" /> Más
                      de 1.500 productos
                    </span>
                  </div>
                </div>

                {/* Hero Showcase with Liquid Glass Floating Frame */}
                <div className="relative min-h-[340px] sm:min-h-[440px] lg:min-h-[540px] rounded-[36px] overflow-hidden liquid-glass p-2.5 shadow-[0_30px_70px_-20px_rgba(20,83,45,0.15)]">
                  <div className="relative h-full w-full rounded-[28px] overflow-hidden">
                    <img
                      src={heroImage}
                      width={1536}
                      height={1024}
                      alt="Bolsa de compras con alimentos frescos y productos de despensa"
                      className="absolute inset-0 h-full w-full object-cover object-[68%_center] transition-transform duration-1000 ease-out hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* Floating Glass Stats Bar */}
            <section className="relative z-10 mx-auto -mt-6 max-w-4xl px-4 sm:px-6">
              <div className="grid grid-cols-3 divide-x divide-white/60 rounded-[28px] liquid-glass-dock px-4 py-5 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.08)] sm:px-10">
                {[
                  ["+1.5K", "Productos"],
                  ["24h", "Entrega rápida"],
                  ["4.9", "Valoración"],
                ].map(([value, label]) => (
                  <div key={label} className="text-center">
                    <strong className="block text-2xl font-black text-primary sm:text-3xl">
                      {value}
                    </strong>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Categories Showcase: Apple Liquid Glass Cards */}
            <section
              id="categorias"
              className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <SectionTitle
                  eyebrow="Encuentra lo que buscas"
                  title="Compra por categoría"
                  align="left"
                />
                <button
                  type="button"
                  onClick={() => navigateTo("tienda")}
                  className="rounded-full border border-white/80 bg-white/70 px-5 py-2 text-xs font-bold text-primary shadow-xs backdrop-blur-md transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95 self-start sm:self-auto flex items-center gap-2"
                >
                  <StoreIcon className="size-3.5" />
                  <span>Ver todas en la Tienda</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {CATEGORIES.map((category) => {
                  const Icon = categoryIconMap[category.id];
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => navigateTo("tienda", category.id)}
                      className="group relative flex flex-col justify-between rounded-[32px] liquid-glass-card liquid-reflection p-7 text-left active:scale-[0.98]"
                    >
                      <div>
                        <div
                          className={`grid size-14 place-items-center rounded-2xl border shadow-sm transition-transform duration-500 group-hover:scale-110 ${category.accent}`}
                        >
                          <Icon className="size-7" />
                        </div>
                        <span className="mt-5 inline-block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {category.count}
                        </span>
                        <h3 className="mt-1 text-xl font-extrabold leading-snug text-brand-deep transition-colors group-hover:text-primary">
                          {category.name}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {category.description}
                        </p>
                      </div>

                      <div className="mt-7 flex items-center justify-between border-t border-white/60 pt-4 text-xs font-bold text-primary">
                        <span>Explorar en Tienda</span>
                        <div className="grid size-7 place-items-center rounded-full bg-white/80 shadow-2xs group-hover:translate-x-1 transition-transform">
                          <ArrowRight className="size-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Featured Products Rail with Frosted Glass Cards */}
            <section id="destacados" className="relative py-16 lg:py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
                  <SectionTitle
                    eyebrow="Elegidos para ti"
                    title="Productos destacados"
                    align="left"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="grid size-10 place-items-center rounded-full border border-white/80 bg-white/70 text-foreground shadow-xs active:scale-90 hover:bg-white"
                      onClick={() => scroll(productRail, -1)}
                      aria-label="Productos anteriores"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="grid size-10 place-items-center rounded-full border border-white/80 bg-white/70 text-foreground shadow-xs active:scale-90 hover:bg-white"
                      onClick={() => scroll(productRail, 1)}
                      aria-label="Productos siguientes"
                    >
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="relative mt-6 max-w-md sm:max-w-lg">
                  <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Filtrar destacados..."
                    aria-label="Buscar productos"
                    className="h-11 w-full rounded-full border border-white/80 bg-white/70 pl-11 pr-10 text-sm outline-none backdrop-blur-md shadow-inner transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                  {query && (
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-full bg-muted text-muted-foreground"
                      onClick={() => setQuery("")}
                      aria-label="Borrar búsqueda"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <div
                  ref={productRail}
                  className="mt-8 flex snap-x gap-5 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {featuredProducts.map((product) => {
                    const inCart = cart[product.id] ?? 0;
                    return (
                      <article
                        key={product.id}
                        className="group w-[80vw] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-[28px] liquid-glass-card liquid-reflection p-3.5 sm:p-4"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/60 border border-white/80 shadow-inner">
                          {product.pos ? (
                            <div
                              className={`absolute inset-0 bg-cover transition-transform duration-700 group-hover:scale-108 ${product.pos}`}
                              style={{
                                backgroundImage: `url(${productsImage})`,
                                backgroundSize: "300% 200%",
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                              <ShoppingBasket className="size-12 text-muted-foreground/60" />
                            </div>
                          )}

                          {product.badge && (
                            <span className="absolute left-3 top-3 rounded-full bg-offer px-2.5 py-0.5 text-[10px] font-black text-offer-foreground shadow-sm">
                              {product.badge}
                            </span>
                          )}

                          <button
                            type="button"
                            className={`absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/85 border border-white/90 shadow-sm backdrop-blur-md transition-all duration-300 active:scale-90 hover:scale-110 ${
                              favorites.has(product.id)
                                ? "text-destructive"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => toggleFavorite(product.id)}
                            aria-label={
                              favorites.has(product.id)
                                ? "Quitar de favoritos"
                                : "Agregar a favoritos"
                            }
                          >
                            <Heart
                              className={`size-4 ${
                                favorites.has(product.id) ? "fill-current" : ""
                              }`}
                            />
                          </button>
                        </div>

                        <div className="p-2 pt-3">
                          <p className="text-xs text-muted-foreground">
                            {product.detail}
                          </p>
                          <h3 className="mt-1 font-bold text-sm line-clamp-1">
                            {product.name}
                          </h3>
                          <div className="mt-4 flex items-end justify-between gap-3">
                            <div>
                              <strong className="text-lg font-black text-primary">
                                ${product.price.toFixed(2)}
                              </strong>
                              {product.oldPrice && (
                                <span className="ml-2 text-xs text-muted-foreground line-through">
                                  ${product.oldPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              className={`grid size-9 place-items-center rounded-full shadow-md active:scale-90 transition-all ${
                                inCart > 0
                                  ? "bg-offer text-offer-foreground shadow-offer/30"
                                  : "bg-primary text-primary-foreground shadow-primary/30"
                              }`}
                              onClick={() => changeCart(product.id, 1)}
                              aria-label={`Agregar ${product.name} al carrito`}
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => navigateTo("tienda")}
                    className="rounded-full bg-primary px-8 py-3 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 liquid-glass-button active:scale-95 inline-flex items-center gap-2"
                  >
                    <StoreIcon className="size-4" />
                    <span>Ver todos los productos en la Tienda</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Weekly Promo Banner: Frosted Glass Horizon */}
            <section
              id="ofertas"
              className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
            >
              <div className="relative min-h-[400px] overflow-hidden rounded-[36px] liquid-glass p-2 shadow-[0_25px_60px_-15px_rgba(20,83,45,0.15)]">
                <div className="relative min-h-[390px] rounded-[30px] overflow-hidden bg-brand-deep">
                  <img
                    src={promoImage}
                    loading="lazy"
                    width={1536}
                    height={768}
                    alt="Compra semanal con alimentos y productos del hogar"
                    className="absolute inset-0 h-full w-full object-cover object-[64%_center]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/95 via-brand-deep/80 to-transparent" />
                  <div className="relative flex min-h-[390px] max-w-xl flex-col justify-center p-8 text-primary-foreground sm:p-14">
                    <span className="w-fit rounded-full bg-sun px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-deep shadow-xs">
                      Oferta de la semana
                    </span>
                    <h2 className="mt-5 text-3xl font-black leading-tight sm:text-5xl tracking-tight">
                      Llena tu carrito.
                      <br />
                      <span className="text-sun">Ahorra en grande.</span>
                    </h2>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/80 sm:text-base">
                      Hasta 30% de descuento en productos seleccionados de despensa y aseo.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateTo("tienda")}
                      className="mt-8 w-fit rounded-full bg-offer px-8 py-3.5 font-bold text-offer-foreground text-sm shadow-xl shadow-offer/30 liquid-glass-button active:scale-95 flex items-center gap-2"
                    >
                      <span>Ver ofertas en la Tienda</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Benefits: Floating Glass Pods */}
            <section className="py-14">
              <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-6 md:grid-cols-5 lg:px-8">
                {benefits.map(({ icon: Icon, title, text }, index) => (
                  <div
                    key={title}
                    className={`flex flex-col items-center rounded-[28px] liquid-glass-card p-6 text-center ${
                      index === 4 ? "col-span-2 md:col-span-1" : ""
                    }`}
                  >
                    <div className="grid size-14 place-items-center rounded-2xl border border-white/80 bg-white/80 text-primary shadow-xs">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="mt-4 text-sm font-extrabold text-foreground">{title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Testimonials: Apple Frosted Glass Cards */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 mb-8">
                <SectionTitle
                  eyebrow="Clientes felices"
                  title="Lo que dicen de nosotros"
                  align="left"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-full border border-white/80 bg-white/70 text-foreground shadow-xs active:scale-90 hover:bg-white"
                    onClick={() => scroll(testimonialRail, -1)}
                    aria-label="Testimonio anterior"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-full border border-white/80 bg-white/70 text-foreground shadow-xs active:scale-90 hover:bg-white"
                    onClick={() => scroll(testimonialRail, 1)}
                    aria-label="Testimonio siguiente"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>

              <div
                ref={testimonialRail}
                className="flex snap-x gap-5 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {[
                  [
                    "María G.",
                    "La compra llegó rapidísimo y todo estaba perfectamente empacado. Ya es mi supermercado de confianza.",
                    "MG",
                  ],
                  [
                    "Carlos R.",
                    "Encuentro todo lo de la semana en minutos. Los precios y las ofertas realmente valen la pena.",
                    "CR",
                  ],
                  [
                    "Ana P.",
                    "La experiencia visual es increíblemente fluida y la calidad de los productos siempre supera mis expectativas.",
                    "AP",
                  ],
                  [
                    "David L.",
                    "El pedido por WhatsApp es comodísimo. Envié mi lista y en 40 minutos ya lo tenía todo listo en casa.",
                    "DL",
                  ],
                ].map(([name, quote, initials], index) => (
                  <TestimonialCard
                    key={name}
                    name={name}
                    quote={quote}
                    initials={initials}
                    index={index}
                  />
                ))}
              </div>
            </section>

            {/* Newsletter: Frosted Glass Pod */}
            <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
              <div className="rounded-[36px] liquid-glass p-8 sm:p-14 text-center shadow-[0_20px_50px_-15px_rgba(20,83,45,0.08)]">
                <span className="mx-auto grid size-13 place-items-center rounded-2xl bg-white/80 border border-white text-offer shadow-xs">
                  <Mail className="size-6" />
                </span>
                <h2 className="mt-5 text-3xl font-black text-brand-deep tracking-tight">
                  Ofertas frescas en tu correo
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Suscríbete y recibe cupones de descuento exclusivos, novedades y ofertas de temporada.
                </p>
                {subscribed ? (
                  <p className="mt-7 font-bold text-primary animate-in fade-in">
                    ¡Listo! Pronto recibirás nuestras mejores ofertas.
                  </p>
                ) : (
                  <form
                    className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row"
                    onSubmit={(event: FormEvent) => {
                      event.preventDefault();
                      setSubscribed(true);
                    }}
                  >
                    <input
                      required
                      type="email"
                      placeholder="Tu correo electrónico"
                      aria-label="Correo electrónico"
                      className="h-12 min-w-0 flex-1 rounded-full border border-white/80 bg-white/80 px-5 text-sm outline-none backdrop-blur-md shadow-inner focus:bg-white focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit"
                      className="h-12 rounded-full bg-primary px-7 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 liquid-glass-button active:scale-95"
                    >
                      Suscribirme
                    </button>
                  </form>
                )}
              </div>
            </section>

            {/* Contactos Section (Apple Liquid Glass 2026) */}
            <section id="contactos" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-offer shadow-xs backdrop-blur-md">
                  <MessageSquare className="size-3.5" />
                  <span>Atención directa y cercana</span>
                </span>
                <h2 className="mt-4 text-3xl font-black text-brand-deep sm:text-5xl tracking-tight">
                  Contáctanos
                </h2>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  ¿Tienes alguna duda sobre tu compra, entregas, sugerencias o requieres atención personalizada? Nuestro equipo está listo para ayudarte todos los días.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Contact Cards Pods */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-[28px] liquid-glass-card p-6 flex items-start gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0 shadow-2xs">
                      <Phone className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-foreground">Teléfono & WhatsApp</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Atención inmediata con un asesor</p>
                      <a href="tel:+18002663474" className="mt-2 inline-block text-sm font-black text-primary hover:underline">
                        +1 800 CONDI RICO (266-3474)
                      </a>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Lunes a Domingo: 8:00 AM – 8:00 PM</p>
                      <button
                        type="button"
                        onClick={() => setWhatsAppModalOpen(true)}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm active:scale-95 transition-all"
                      >
                        <WhatsAppIcon className="size-3.5" />
                        <span>Hacer Pedido por WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[28px] liquid-glass-card p-6 flex items-start gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0 shadow-2xs">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-foreground">Correo Electrónico</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Escríbenos para soporte, pedidos o facturación</p>
                      <a href="mailto:hola@condirico.com" className="mt-2 inline-block text-sm font-black text-primary hover:underline">
                        hola@condirico.com
                      </a>
                      <p className="text-[11px] text-muted-foreground mt-0.5">soporte@condirico.com</p>
                    </div>
                  </div>

                  <div className="rounded-[28px] liquid-glass-card p-6 flex items-start gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-teal-100 text-teal-700 border border-teal-200 shrink-0 shadow-2xs">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-foreground">Centro de Distribución & Tienda</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Av. Principal Los Jardines #450, Ciudad Central</p>
                      <p className="mt-2 text-xs font-bold text-teal-700">Envíos directos a todo el municipio en 24h</p>
                    </div>
                  </div>

                  <div className="rounded-[28px] liquid-glass-card p-6 flex items-start gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-orange-100 text-orange-700 border border-orange-200 shrink-0 shadow-2xs">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-foreground">Horario de Entregas</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Reparto continuo en turnos mañana y tarde</p>
                      <p className="mt-1 text-xs font-bold text-foreground">Lunes a Domingo: 7:00 AM – 10:00 PM</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Contact Form (Frosted Glass Container) */}
                <div className="lg:col-span-7 rounded-[36px] liquid-glass p-7 sm:p-10 shadow-[0_20px_50px_-15px_rgba(20,83,45,0.08)]">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="size-4 text-offer" />
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-offer">
                      Envíanos un mensaje directo
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-brand-deep tracking-tight">
                    ¿En qué podemos ayudarte?
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Completa el formulario y te responderemos a la brevedad posible.
                  </p>

                  {contactSubmitted ? (
                    <div className="mt-8 rounded-3xl bg-emerald-50/80 border border-emerald-200 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                        <CheckCircle2 className="size-8" />
                      </div>
                      <h4 className="mt-4 text-xl font-black text-emerald-950">
                        ¡Mensaje enviado con éxito!
                      </h4>
                      <p className="mt-2 text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                        Gracias por escribirnos, <strong>{contactForm.name || "estimado cliente"}</strong>. Un asesor de CondiRico revisará tu consulta y se comunicará contigo al correo en menos de 2 horas.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setContactSubmitted(false);
                          setContactForm({ name: "", email: "", phone: "", topic: "Consulta sobre un pedido", message: "" });
                        }}
                        className="mt-6 rounded-full bg-emerald-700 text-white px-6 py-2.5 text-xs font-bold shadow-sm hover:bg-emerald-800 transition-colors"
                      >
                        Enviar otro mensaje
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setContactSubmitted(true);
                      }}
                      className="mt-6 space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">
                            Tu Nombre y Apellido
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Ej. María González"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            className="h-11 w-full rounded-2xl border border-white/80 bg-white/80 px-4 text-sm outline-none backdrop-blur-md shadow-inner transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">
                            Correo Electrónico
                          </label>
                          <input
                            required
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            className="h-11 w-full rounded-2xl border border-white/80 bg-white/80 px-4 text-sm outline-none backdrop-blur-md shadow-inner transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">
                            Teléfono o Celular (Opcional)
                          </label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                            className="h-11 w-full rounded-2xl border border-white/80 bg-white/80 px-4 text-sm outline-none backdrop-blur-md shadow-inner transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">
                            Motivo de Contacto
                          </label>
                          <select
                            value={contactForm.topic}
                            onChange={(e) => setContactForm({ ...contactForm, topic: e.target.value })}
                            className="h-11 w-full rounded-2xl border border-white/80 bg-white/80 px-3.5 text-sm outline-none backdrop-blur-md shadow-inner transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="Consulta sobre un pedido">Consulta sobre un pedido</option>
                            <option value="Duda de entregas o envíos">Duda de entregas o envíos</option>
                            <option value="Sugerencia de producto">Sugerencia de producto</option>
                            <option value="Proveedores o negocios">Proveedores o negocios</option>
                            <option value="Otro motivo">Otro motivo</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          Mensaje o Consulta
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Escribe aquí tu duda, sugerencia o detalle de tu compra..."
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          className="w-full rounded-2xl border border-white/80 bg-white/80 p-4 text-sm outline-none backdrop-blur-md shadow-inner transition-all focus:bg-white focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full sm:w-auto h-12 rounded-full bg-primary px-8 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 liquid-glass-button active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Send className="size-4" />
                          <span>Enviar mensaje</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative bg-brand-deep/95 text-primary-foreground pb-24 md:pb-8 border-t border-white/10 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <Brand light onClick={() => navigateTo("inicio")} />
            <p className="mt-4 max-w-xs text-sm leading-6 text-primary-foreground/75">
              Todo lo que tu hogar necesita, con calidad, confianza y precios
              que te convienen.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-sm">Navegación</h3>
            <ul className="mt-4 space-y-2.5 text-xs text-primary-foreground/75">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo("inicio")}
                  className="hover:text-sun transition-colors"
                >
                  Página de Inicio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo("tienda")}
                  className="hover:text-sun transition-colors font-bold text-sun"
                >
                  Catálogo de Tienda
                </button>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => navigateTo("tienda", c.id)}
                    className="hover:text-sun transition-colors"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (currentPage !== "inicio") {
                      navigateTo("inicio");
                      setTimeout(() => {
                        document.querySelector("#contactos")?.scrollIntoView({ behavior: "smooth" });
                      }, 150);
                    } else {
                      document.querySelector("#contactos")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="hover:text-sun transition-colors"
                >
                  Contactos
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm">Ayuda</h3>
            <ul className="mt-4 space-y-2.5 text-xs text-primary-foreground/75">
              <li>Preguntas frecuentes</li>
              <li>Envíos y entregas en 24h</li>
              <li>Garantía y devoluciones</li>
              <li>Términos y condiciones</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm">Contáctanos</h3>
            <p className="mt-4 text-xs leading-6 text-primary-foreground/75">
              hola@condirico.com
              <br />
              +1 800 CONDI RICO
              <br />
              Lun–Dom, 8:00–20:00
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-[11px] text-primary-foreground/50">
          © 2026 CondiRico · Diseñado con estilo Apple Liquid Glass 2026.
        </div>
      </footer>

      {/* Floating Thumb Dock for Mobile */}
      <ThumbBottomNav
        currentPage={currentPage}
        onNavigate={navigateTo}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Thumb Search Modal */}
      <ThumbSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onAddToCart={changeCart}
        cart={cart}
        onNavigateToStore={() => {
          setSearchModalOpen(false);
          navigateTo("tienda");
        }}
      />

      {/* Floating WhatsApp Button */}
      <FloatingWhatsAppButton
        onClick={() => setWhatsAppModalOpen(true)}
        cartCount={cartCount}
      />

      {/* WhatsApp Order Modal */}
      <WhatsAppOrderModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        cart={cart}
        onClearCart={() => setCart({})}
      />

      {/* Shopping Cart Drawer: Apple Frosted Glass Layer */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="ml-auto flex h-full w-full max-w-md flex-col liquid-glass-dock p-6 shadow-2xl animate-in slide-in-from-right duration-400"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/60 pb-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  Tu compra
                </p>
                <h2 className="text-2xl font-black text-brand-deep">Carrito</h2>
              </div>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-full bg-white/80 border border-white text-muted-foreground shadow-xs active:scale-90"
                onClick={() => setCartOpen(false)}
                aria-label="Cerrar carrito"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
              {cartCount === 0 ? (
                <div className="grid h-full place-content-center text-center">
                  <div className="mx-auto grid size-16 place-items-center rounded-2xl liquid-glass-card shadow-xs">
                    <ShoppingCart className="size-8 text-muted-foreground/60" />
                  </div>
                  <p className="mt-4 font-extrabold text-lg text-foreground">Tu carrito está vacío</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Agrega productos de la tienda para comenzar.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      navigateTo("tienda");
                    }}
                    className="mt-5 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 liquid-glass-button"
                  >
                    Explorar la Tienda
                  </button>
                </div>
              ) : (
                ALL_PRODUCTS.filter((product) => cart[product.id]).map(
                  (product) => (
                    <div
                      key={product.id}
                      className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-2xl liquid-glass-card p-3 shadow-2xs"
                    >
                      <div className="relative size-16 rounded-xl bg-white/60 border border-white/80 overflow-hidden shadow-inner">
                        {product.pos ? (
                          <div
                            className={`size-full bg-cover ${product.pos}`}
                            style={{
                              backgroundImage: `url(${productsImage})`,
                              backgroundSize: "300% 200%",
                            }}
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center bg-muted text-muted-foreground">
                            <ShoppingBasket className="size-6 text-primary" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-xs font-extrabold text-foreground">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          ${product.price.toFixed(2)} · {product.detail}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-full bg-white/80 border border-white text-primary shadow-xs active:scale-90"
                          onClick={() => changeCart(product.id, -1)}
                          aria-label="Quitar uno"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-foreground">
                          {cart[product.id]}
                        </span>
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs active:scale-90"
                          onClick={() => changeCart(product.id, 1)}
                          aria-label="Agregar uno"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            {cartCount > 0 && (
              <div className="border-t border-white/60 pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Total estimado
                  </span>
                  <strong className="text-2xl font-black text-primary">
                    ${cartTotal.toFixed(2)}
                  </strong>
                </div>
                <div className="mt-1.5 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Envío:</span>
                  <span className="font-bold text-emerald-600">
                    {cartTotal >= 35 ? "Gratis" : "$3.50 (Gratis desde $35)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    setWhatsAppModalOpen(true);
                  }}
                  className="mt-4 h-13 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 liquid-glass-button active:scale-95"
                >
                  <WhatsAppIcon className="size-5" />
                  <span>Pedir por WhatsApp (${(cartTotal >= 35 ? cartTotal : cartTotal + 3.5).toFixed(2)})</span>
                </button>

                <button
                  type="button"
                  className="mt-2 h-10 w-full rounded-2xl border border-white/80 bg-white/70 text-foreground font-bold text-xs shadow-xs hover:bg-white active:scale-95"
                  onClick={() => setCartOpen(false)}
                >
                  Seguir explorando
                </button>
                <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
                  Atención directa y confirmación en tiempo real por WhatsApp
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function TestimonialCard({
  name,
  quote,
  initials,
  index,
}: {
  name: string;
  quote: string;
  initials: string;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      style={{
        transitionDelay: `${index * 130}ms`,
      }}
      className={`w-[84vw] max-w-[390px] shrink-0 snap-start rounded-[32px] liquid-glass-card p-7 shadow-xs transform transition-all duration-700 ease-out will-change-transform ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-9 scale-[0.97] pointer-events-none"
      }`}
    >
      <div className="flex justify-between items-center">
        <Quote className="size-7 text-offer" />
        <div className="flex text-sun">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="size-4 fill-current" />
          ))}
        </div>
      </div>
      <p className="mt-5 text-sm leading-7 text-muted-foreground">
        “{quote}”
      </p>
      <div className="mt-6 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-xs font-extrabold text-primary border border-white">
          {initials}
        </span>
        <div>
          <strong className="block text-sm font-bold">{name}</strong>
          <span className="text-xs text-muted-foreground">
            Cliente verificado
          </span>
        </div>
      </div>
    </article>
  );
}

function SectionTitle({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center" : "min-w-0"}>
      <p className="text-[11px] font-black uppercase tracking-widest text-offer">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-2xl font-black text-brand-deep sm:text-4xl tracking-tight">
        {title}
      </h2>
    </div>
  );
}
