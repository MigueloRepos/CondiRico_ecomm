import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock,
  Clock3,
  Heart,
  Home,
  Instagram,
  LayoutGrid,
  Leaf,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  PackageCheck,
  Pause,
  Phone,
  Play,
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
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import { ThumbBottomNav } from "@/components/ThumbBottomNav";
import { ThumbSearchModal } from "@/components/ThumbSearchModal";
import { StorePage } from "@/components/StorePage";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { WhatsAppOrderModal } from "@/components/WhatsAppOrderModal";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";
import { AuthPage } from "@/components/AuthPage";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { VoiceSearchModal } from "@/components/VoiceSearchModal";
import { UserProfile, getCurrentSessionUser, setSessionUser } from "@/lib/auth";
import {
  Fingerprint,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldAlert,
} from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState<"inicio" | "tienda" | "auth">("inicio");
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
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentSessionUser());
  const [intendedAuthNotice, setIntendedAuthNotice] = useState<string>("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
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
  const heroRef = useRef<HTMLElement>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [isCarouselAutoPlay, setIsCarouselAutoPlay] = useState(true);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroImageY = useTransform(heroScrollProgress, [0, 1], ["0%", "18%"]);
  const heroImageScale = useTransform(heroScrollProgress, [0, 1], [1, 1.08]);
  const heroTextY = useTransform(heroScrollProgress, [0, 1], ["0%", "10%"]);
  const heroFloatY1 = useTransform(heroScrollProgress, [0, 1], ["0px", "-45px"]);
  const heroFloatY2 = useTransform(heroScrollProgress, [0, 1], ["0px", "-25px"]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#tienda")) {
        setCurrentPage("tienda");
        if (hash.includes("alimentos")) setTargetCategory("alimentos");
        else if (hash.includes("necesidad")) setTargetCategory("primera-necesidad");
        else if (hash.includes("limpieza")) setTargetCategory("limpieza");
        else if (hash.includes("utiles")) setTargetCategory("utiles");
      } else if (hash === "#auth") {
        setCurrentPage("auth");
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

  // Smooth scroll to product index
  const scrollToProductIndex = (index: number) => {
    if (!productRail.current || featuredProducts.length === 0) return;
    const clampedIndex = Math.max(0, Math.min(index, featuredProducts.length - 1));
    setActiveCarouselIndex(clampedIndex);
    const container = productRail.current;
    const cardEl = container.querySelector("article");
    const cardWidth = cardEl ? cardEl.getBoundingClientRect().width : 280;
    const gap = 20;
    container.scrollTo({
      left: clampedIndex * (cardWidth + gap),
      behavior: "smooth",
    });
  };

  const handlePrevProduct = () => {
    const prev = activeCarouselIndex === 0 ? featuredProducts.length - 1 : activeCarouselIndex - 1;
    scrollToProductIndex(prev);
  };

  const handleNextProduct = () => {
    const next = (activeCarouselIndex + 1) % featuredProducts.length;
    scrollToProductIndex(next);
  };

  // Autoplay timer with pause on hover
  useEffect(() => {
    if (!isCarouselAutoPlay || isCarouselHovered || featuredProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveCarouselIndex((curr) => {
        const next = (curr + 1) % featuredProducts.length;
        if (productRail.current) {
          const container = productRail.current;
          const cardEl = container.querySelector("article");
          const cardWidth = cardEl ? cardEl.getBoundingClientRect().width : 280;
          const gap = 20;
          container.scrollTo({
            left: next * (cardWidth + gap),
            behavior: "smooth",
          });
        }
        return next;
      });
    }, 3800);

    return () => clearInterval(timer);
  }, [isCarouselAutoPlay, isCarouselHovered, featuredProducts.length]);

  // Sync active carousel index on manual scroll/touch swipe
  useEffect(() => {
    const container = productRail.current;
    if (!container) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const cardEl = container.querySelector("article");
        const cardWidth = cardEl ? cardEl.getBoundingClientRect().width : 280;
        const gap = 20;
        const scrollLeft = container.scrollLeft;
        const newIndex = Math.round(scrollLeft / (cardWidth + gap));
        if (newIndex >= 0 && newIndex < featuredProducts.length) {
          setActiveCarouselIndex(newIndex);
        }
      }, 120);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [featuredProducts.length]);

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

  const navigateTo = (page: "inicio" | "tienda" | "auth", categoryId?: CategoryId) => {
    setCurrentPage(page);
    setMenuOpen(false);
    setUserDropdownOpen(false);
    if (page === "tienda") {
      setTargetCategory(categoryId || null);
      window.location.hash = categoryId ? `#tienda-${categoryId}` : "#tienda";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (page === "auth") {
      window.location.hash = "#auth";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.hash = "#inicio";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLogout = () => {
    setSessionUser(null);
    setCurrentUser(null);
    setUserDropdownOpen(false);
  };

  const handleSuccessAuth = (user: UserProfile) => {
    setCurrentUser(user);
    if (intendedAuthNotice) {
      setIntendedAuthNotice("");
      setCartOpen(false);
      setWhatsAppModalOpen(true);
      navigateTo("tienda");
    } else {
      navigateTo("tienda");
    }
  };

  const handleProceedToCheckout = () => {
    if (!currentUser) {
      setIntendedAuthNotice("Para comprar y finalizar tu pedido necesitas iniciar sesión o registrarte.");
      setCartOpen(false);
      navigateTo("auth");
      return;
    }
    setCartOpen(false);
    setWhatsAppModalOpen(true);
  };

  return (
    <div id="inicio" className="relative min-h-screen text-foreground flex flex-col selection:bg-sun selection:text-brand-deep">
      {/* Volumetric Ambient Mesh Lighting Layers for Glassmorphism */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Top-Right Emerald Aurora */}
        <div className="absolute -top-32 right-10 h-[620px] w-[620px] rounded-full bg-gradient-to-br from-emerald-400/35 via-teal-300/25 to-transparent blur-[120px] animate-float-slow" />
        {/* Top-Left Amber Gold Sun */}
        <div className="absolute -top-20 -left-20 h-[580px] w-[580px] rounded-full bg-gradient-to-tr from-amber-300/35 via-orange-200/25 to-transparent blur-[130px] animate-float-reverse" />
        {/* Center Mint Lime Prism */}
        <div className="absolute top-1/3 left-1/4 h-[550px] w-[550px] rounded-full bg-gradient-to-r from-lime-300/30 via-emerald-200/25 to-teal-200/25 blur-[140px] animate-float-center" />
        {/* Mid-Right Turquoise Glow */}
        <div className="absolute top-1/2 -right-32 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-teal-300/35 via-cyan-200/25 to-transparent blur-[130px] animate-float-slow" />
        {/* Bottom Emerald Radiance */}
        <div className="absolute bottom-0 left-10 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-emerald-300/35 via-amber-200/25 to-transparent blur-[140px] animate-float-reverse" />
      </div>

      {/* Top Banner (Apple Liquid Pill) */}
      <div className="relative z-50 bg-brand-deep/95 backdrop-blur-md px-4 py-2 text-xs font-semibold text-primary-foreground border-b border-white/10 shadow-xs">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 items-center gap-2 md:gap-6">
          {/* Parte 1: Datos de Contacto */}
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

            <span className="text-white/25 select-none">•</span>

            <a
              href="tel:+18002663474"
              className="inline-flex items-center gap-1.5 text-primary-foreground/90 hover:text-sun transition-colors active:scale-95 group"
              aria-label="Teléfono de contacto: +1 800 CONDI RICO"
            >
              <Phone className="size-3.5 text-sun shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] sm:text-xs font-medium">+1 800 CONDI RICO</span>
            </a>
          </div>

          {/* Parte 2: Redes Sociales */}
          <div className="flex items-center justify-center md:justify-end gap-3 sm:gap-4 pt-1.5 md:pt-0 border-t border-white/10 md:border-t-0">
            <span className="text-[10px] uppercase tracking-wider text-primary-foreground/60 font-bold hidden sm:inline">
              Síguenos:
            </span>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => setWhatsAppModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-primary-foreground/90 hover:text-emerald-400 transition-colors active:scale-95 group"
              aria-label="Abrir WhatsApp CondiRico"
            >
              <WhatsAppIcon className="size-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] sm:text-xs font-medium">WhatsApp</span>
            </button>

            <span className="text-white/25 select-none">•</span>

            {/* Instagram */}
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

            <span className="text-white/25 select-none">•</span>

            {/* Twitter */}
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
            <div className="relative hidden xl:flex items-center">
              <span className="sr-only">Buscar productos</span>
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar productos..."
                className="h-10 w-56 rounded-full border border-white/80 bg-white/60 pl-9 pr-9 text-xs outline-none backdrop-blur-md transition-all shadow-inner focus:w-64 focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <VoiceSearchButton
                  onClick={() => setVoiceModalOpen(true)}
                  ariaLabel="Buscar por voz"
                />
              </div>
            </div>

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

            {/* User Account / Biometrics Status */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-50/90 pl-1.5 pr-2.5 sm:pr-3 py-1 text-xs font-bold text-emerald-950 shadow-xs backdrop-blur-md transition-all hover:bg-emerald-100/90 active:scale-95"
                  aria-label="Abrir menú de usuario"
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
                      {currentUser.hasBiometrics ? (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <Fingerprint className="size-3" />
                          <span>Huella dactilar activa</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            navigateTo("auth");
                          }}
                          className="mt-1 text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <Fingerprint className="size-3" />
                          <span>Activar huella biométrica</span>
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50/80 transition-colors"
                    >
                      <LogOut className="size-3.5" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIntendedAuthNotice("");
                  navigateTo("auth");
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 sm:px-3.5 py-2 text-xs font-bold text-foreground shadow-xs backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-primary active:scale-95"
              >
                <UserIcon className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
              </button>
            )}

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
              {/* Account Quick Card */}
              <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/80 flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm">
                    {currentUser ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="size-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-foreground truncate max-w-[150px]">
                      {currentUser ? currentUser.name : "Tu Cuenta CondiRico"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {currentUser ? (currentUser.hasBiometrics ? "Huella dactilar activa" : currentUser.email) : "Acceso seguro para comprar"}
                    </p>
                  </div>
                </div>
                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"
                  >
                    Salir
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setIntendedAuthNotice("");
                      navigateTo("auth");
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-primary-foreground bg-primary rounded-xl shadow-xs"
                  >
                    Acceder
                  </button>
                )}
              </div>

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
        {currentPage === "auth" ? (
          <AuthPage
            onSuccessAuth={handleSuccessAuth}
            onNavigate={navigateTo}
            intendedActionNotice={intendedAuthNotice}
            cartCount={cartCount}
          />
        ) : currentPage === "tienda" ? (
          <StorePage
            initialCategory={targetCategory}
            cart={cart}
            onAddToCart={changeCart}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onOpenCart={() => setCartOpen(true)}
            onOpenWhatsAppOrder={() => {
              if (!currentUser) {
                setIntendedAuthNotice("Para realizar tu pedido y comprar debes iniciar sesión o registrarte.");
                navigateTo("auth");
              } else {
                setWhatsAppModalOpen(true);
              }
            }}
          />
        ) : (
          <div>
            {/* Hero Section: Apple Liquid Glass 2026 with Parallax */}
            <section
              ref={heroRef}
              className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16"
            >
              <div className="mx-auto grid max-w-[1536px] lg:grid-cols-2 gap-8 items-center px-4 sm:px-6 lg:px-12">
                <motion.div
                  style={{ y: heroTextY }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-xl"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-primary shadow-xs backdrop-blur-md"
                  >
                    <Sparkle className="size-3.5 text-offer animate-pulse" />
                    <span>Tu supermercado de confianza</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-4xl font-black leading-[1.07] tracking-tight text-brand-deep sm:text-5xl lg:text-6xl"
                  >
                    Todo lo que necesitas
                    <br />
                    <span className="text-offer">en un solo lugar</span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-6 max-w-md text-base leading-7 text-muted-foreground"
                  >
                    Productos frescos, despensa completa, limpieza y artículos
                    del hogar con entrega garantizada en 24 horas.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5"
                  >
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
                  </motion.div>
                </motion.div>

                {/* Hero Showcase with Liquid Glass Floating Frame & Parallax */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative min-h-[340px] sm:min-h-[440px] lg:min-h-[540px] rounded-[36px] overflow-hidden liquid-glass p-2.5 shadow-[0_30px_70px_-20px_rgba(20,83,45,0.15)]"
                >
                  <div className="relative h-full w-full rounded-[28px] overflow-hidden">
                    <motion.img
                      style={{ y: heroImageY, scale: heroImageScale }}
                      src={heroImage}
                      width={1536}
                      height={1024}
                      alt="Bolsa de compras con alimentos frescos y productos de despensa"
                      className="absolute inset-0 h-full w-full object-cover object-[68%_center] will-change-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

                    {/* Floating Parallax Badges (Apple Liquid Glass) */}
                    <motion.div
                      style={{ y: heroFloatY1 }}
                      className="absolute bottom-6 left-6 rounded-2xl border border-white/80 bg-white/85 backdrop-blur-xl px-4 py-3 shadow-lg flex items-center gap-3 z-10"
                    >
                      <div className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                        <Truck className="size-4" />
                      </div>
                      <div>
                        <strong className="block text-xs font-black text-brand-deep">Envíos Rápidos 24h</strong>
                        <span className="text-[10px] text-muted-foreground">Directo a tu puerta</span>
                      </div>
                    </motion.div>

                    <motion.div
                      style={{ y: heroFloatY2 }}
                      className="absolute top-6 right-6 rounded-2xl border border-white/80 bg-white/85 backdrop-blur-xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 z-10 hidden sm:flex"
                    >
                      <div className="grid size-8 place-items-center rounded-xl bg-sun/30 text-amber-800">
                        <Sparkle className="size-4 text-offer" />
                      </div>
                      <div>
                        <strong className="block text-xs font-black text-brand-deep">100% Fresco</strong>
                        <span className="text-[10px] text-muted-foreground">Calidad garantizada</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Floating Glass Stats Bar */}
            <motion.section
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 mx-auto -mt-6 max-w-4xl px-4 sm:px-6"
            >
              <div className="grid grid-cols-3 divide-x divide-white/60 rounded-[28px] liquid-glass-dock px-4 py-5 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.08)] sm:px-10">
                {[
                  ["+1.5K", "Productos"],
                  ["24h", "Entrega rápida"],
                  ["4.9", "Valoración"],
                ].map(([value, label], idx) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="text-center"
                  >
                    <strong className="block text-2xl font-black text-primary sm:text-3xl">
                      {value}
                    </strong>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Categories Showcase: Apple Liquid Glass Category Icons */}
            <motion.section
              id="categorias"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <SectionTitle
                  eyebrow="Explora nuestro catálogo"
                  title="Compra por categoría"
                  align="left"
                />
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-xs font-bold text-muted-foreground backdrop-blur-md shadow-2xs">
                    <Sparkles className="size-3.5 text-offer" />
                    <span>{CATEGORIES.length} categorías disponibles</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => navigateTo("tienda")}
                    className="rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold text-primary shadow-xs backdrop-blur-md transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <StoreIcon className="size-3.5" />
                    <span>Ver tienda completa</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid de Iconos de Categorías Disponibles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                {CATEGORIES.map((category, idx) => {
                  const Icon = categoryIconMap[category.id];
                  return (
                    <motion.button
                      key={category.id}
                      type="button"
                      initial={{ opacity: 0, scale: 0.92, y: 20 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -6, scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => navigateTo("tienda", category.id)}
                      className="group relative flex flex-col items-center justify-center rounded-[32px] liquid-glass-card liquid-reflection p-6 sm:p-8 text-center shadow-xs transition-shadow hover:shadow-xl overflow-hidden"
                    >
                      {/* Top Specular Edge */}
                      <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

                      <div
                        className={`grid size-20 sm:size-24 place-items-center rounded-3xl border shadow-sm transition-transform duration-500 group-hover:scale-115 group-hover:rotate-2 ${category.accent}`}
                      >
                        <Icon className="size-10 sm:size-12" />
                      </div>

                      <h3 className="mt-4 text-base sm:text-lg font-black text-brand-deep group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1 max-w-[200px] hidden sm:block">
                        {category.description}
                      </p>

                      <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-white/80 border border-white/90 px-3 py-0.5 rounded-full shadow-2xs group-hover:border-primary/30 group-hover:text-primary transition-colors">
                        <span>{category.count}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>

            {/* Featured Products Carousel: Apple Liquid Glass */}
            <motion.section
              id="destacados"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative py-16 lg:py-24"
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Carousel Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                  <SectionTitle
                    eyebrow="Elegidos para ti"
                    title="Productos destacados"
                    align="left"
                  />

                  {/* Carousel Control Dock */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Active Slide Counter Badge */}
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 py-2 text-xs font-black text-brand-deep shadow-2xs backdrop-blur-md">
                      <span className="text-primary font-black">
                        {String(activeCarouselIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="text-muted-foreground/60">/</span>
                      <span className="text-muted-foreground">
                        {String(featuredProducts.length).padStart(2, "0")}
                      </span>
                    </span>

                    {/* Autoplay Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsCarouselAutoPlay(!isCarouselAutoPlay)}
                      title={isCarouselAutoPlay ? "Pausar carrusel automático" : "Reanudar carrusel automático"}
                      className={`inline-flex items-center gap-1.5 rounded-full border border-white/80 px-3.5 py-2 text-xs font-bold shadow-2xs backdrop-blur-md transition-all active:scale-95 ${
                        isCarouselAutoPlay
                          ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20"
                          : "bg-white/70 text-muted-foreground hover:bg-white hover:text-foreground"
                      }`}
                      aria-label="Alternar carrusel automático"
                    >
                      {isCarouselAutoPlay ? (
                        <>
                          <Pause className="size-3.5 animate-pulse text-primary" />
                          <span className="hidden md:inline">Auto</span>
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5 text-muted-foreground" />
                          <span className="hidden md:inline">Pausado</span>
                        </>
                      )}
                    </button>

                    {/* Arrow Navigation */}
                    <div className="flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 p-1 shadow-2xs backdrop-blur-md">
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-full text-foreground transition-all duration-300 hover:bg-white hover:scale-105 active:scale-90 hover:text-primary"
                        onClick={handlePrevProduct}
                        aria-label="Producto anterior del carrusel"
                      >
                        <ChevronLeft className="size-5" />
                      </button>
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-full text-foreground transition-all duration-300 hover:bg-white hover:scale-105 active:scale-90 hover:text-primary"
                        onClick={handleNextProduct}
                        aria-label="Producto siguiente del carrusel"
                      >
                        <ChevronRight className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filter Search Bar within Destacados */}
                <div className="relative mt-6 max-w-md sm:max-w-lg">
                  <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActiveCarouselIndex(0);
                    }}
                    placeholder="Filtrar productos destacados..."
                    aria-label="Buscar productos destacados"
                    className="h-11 w-full rounded-full border border-white/80 bg-white/75 pl-11 pr-20 text-sm outline-none backdrop-blur-xl shadow-inner transition-all focus:bg-white focus:ring-4 focus:ring-primary/15 focus:border-primary/40"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query ? (
                      <button
                        type="button"
                        className="grid size-6 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground active:scale-90"
                        onClick={() => setQuery("")}
                        aria-label="Borrar búsqueda"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                    <VoiceSearchButton
                      onClick={() => setVoiceModalOpen(true)}
                      ariaLabel="Buscar destacados por voz"
                    />
                  </div>
                </div>

                {/* Carousel Stage Container with Lateral Gradient Masks and Smooth Drag/Scroll */}
                <div
                  className="relative mt-8 group/carousel"
                  onMouseEnter={() => setIsCarouselHovered(true)}
                  onMouseLeave={() => setIsCarouselHovered(false)}
                >
                  {/* Lateral Glass Fade Gradient Mask (Left) */}
                  <div className="pointer-events-none absolute left-0 top-0 bottom-6 w-8 sm:w-16 bg-gradient-to-r from-background via-background/40 to-transparent z-10 hidden sm:block rounded-l-[32px]" />

                  {/* Lateral Glass Fade Gradient Mask (Right) */}
                  <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-8 sm:w-16 bg-gradient-to-l from-background via-background/40 to-transparent z-10 hidden sm:block rounded-r-[32px]" />

                  {/* Floating Edge Navigation Buttons (Desktop) */}
                  <button
                    type="button"
                    onClick={handlePrevProduct}
                    className="absolute -left-4 sm:left-2 top-1/2 -translate-y-1/2 z-20 hidden sm:grid size-11 place-items-center rounded-full border border-white/90 bg-white/85 text-brand-deep shadow-[0_8px_25px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
                    aria-label="Anterior en carrusel"
                  >
                    <ChevronLeft className="size-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextProduct}
                    className="absolute -right-4 sm:right-2 top-1/2 -translate-y-1/2 z-20 hidden sm:grid size-11 place-items-center rounded-full border border-white/90 bg-white/85 text-brand-deep shadow-[0_8px_25px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
                    aria-label="Siguiente en carrusel"
                  >
                    <ChevronRight className="size-5" />
                  </button>

                  {/* Carousel Rail */}
                  <div
                    ref={productRail}
                    className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 pt-2 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
                  >
                    {featuredProducts.map((product, idx) => {
                      const inCart = cart[product.id] ?? 0;
                      const isCurrent = idx === activeCarouselIndex;

                      return (
                        <motion.article
                          key={product.id}
                          whileHover={{ y: -8, scale: 1.02 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className={`group/card relative w-[78vw] max-w-[285px] shrink-0 snap-start overflow-hidden rounded-[30px] liquid-glass-card liquid-reflection p-4 text-left transition-all duration-500 ${
                            isCurrent
                              ? "ring-2 ring-primary/40 shadow-[0_20px_45px_-12px_rgba(16,185,129,0.22)]"
                              : "shadow-[0_12px_30px_-10px_rgba(0,0,0,0.06)]"
                          }`}
                        >
                          {/* Specular Top Edge Line */}
                          <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-85" />

                          {/* Image Container */}
                          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/70 border border-white/90 shadow-inner">
                            {product.pos ? (
                              <div
                                className={`absolute inset-0 bg-cover transition-transform duration-700 group-hover/card:scale-110 ${product.pos}`}
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

                            {/* Badge */}
                            {product.badge && (
                              <span className="absolute left-3 top-3 rounded-full bg-offer px-2.5 py-0.5 text-[10px] font-black text-offer-foreground shadow-sm">
                                {product.badge}
                              </span>
                            )}

                            {/* Rating Micro Pill */}
                            <span className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/90 border border-white px-2 py-0.5 text-[10px] font-extrabold text-foreground shadow-2xs backdrop-blur-md">
                              <Star className="size-3 fill-amber-400 text-amber-400" />
                              <span>{product.rating}</span>
                            </span>

                            {/* Favorite Button */}
                            <button
                              type="button"
                              className={`absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 border border-white/90 shadow-sm backdrop-blur-md transition-all duration-300 active:scale-90 hover:scale-110 ${
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

                          {/* Content & Price */}
                          <div className="p-1.5 pt-3">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              {product.unit}
                            </span>
                            <h3 className="mt-0.5 font-black text-sm text-brand-deep line-clamp-1 group-hover/card:text-primary transition-colors">
                              {product.name}
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                              {product.detail}
                            </p>

                            <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/60 pt-3">
                              <div>
                                <strong className="text-xl font-black text-brand-deep">
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
                                className={`grid size-10 place-items-center rounded-full shadow-md active:scale-90 transition-all duration-300 hover:scale-108 ${
                                  inCart > 0
                                    ? "bg-offer text-offer-foreground shadow-offer/30"
                                    : "bg-primary text-primary-foreground shadow-primary/30"
                                }`}
                                onClick={() => changeCart(product.id, 1)}
                                aria-label={`Agregar ${product.name} al carrito`}
                              >
                                <Plus className="size-4.5" />
                              </button>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>

                  {/* Carousel Interactive Pagination Indicator Dots */}
                  {featuredProducts.length > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      {featuredProducts.map((_, i) => {
                        const isActive = i === activeCarouselIndex;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => scrollToProductIndex(i)}
                            aria-label={`Ir al producto destacado ${i + 1}`}
                            className={`h-2.5 rounded-full transition-all duration-500 active:scale-90 ${
                              isActive
                                ? "w-8 bg-primary shadow-sm shadow-primary/40 scale-105"
                                : "w-2.5 bg-foreground/20 hover:bg-foreground/40"
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Store Link */}
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={() => navigateTo("tienda")}
                    className="rounded-full bg-primary px-8 py-3.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 liquid-glass-button active:scale-95 inline-flex items-center gap-2.5 transition-all hover:scale-105"
                  >
                    <StoreIcon className="size-4" />
                    <span>Explorar catálogo completo en la Tienda</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Weekly Promo Banner: Frosted Glass Horizon */}
            <motion.section
              id="ofertas"
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
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
            </motion.section>

            {/* Benefits: Floating Glass Pods */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6 }}
              className="py-14"
            >
              <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-6 md:grid-cols-5 lg:px-8">
                {benefits.map(({ icon: Icon, title, text }, index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className={`flex flex-col items-center rounded-[28px] liquid-glass-card p-6 text-center ${
                      index === 4 ? "col-span-2 md:col-span-1" : ""
                    }`}
                  >
                    <div className="grid size-14 place-items-center rounded-2xl border border-white/80 bg-white/80 text-primary shadow-xs">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="mt-4 text-sm font-extrabold text-foreground">{title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

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
                    "Valeria M.",
                    "El aceite de oliva virgen extra y las especias llegaron en perfecto estado y con empaque protector. Se nota el cuidado y la frescura en cada detalle para cocinar en casa.",
                    "VM",
                  ],
                  [
                    "Héctor S.",
                    "Hice mi pedido semanal en 5 minutos por WhatsApp y la entrega llegó puntual antes de cenar. El detergente biodegradable y los productos de limpieza huelen increíble.",
                    "HS",
                  ],
                  [
                    "Beatriz C.",
                    "Los paquetes familiares de arroz, harina y leche vegetal tienen precios insuperables. Con el envío gratis al pasar los $35 ahorramos notablemente en el presupuesto del mes.",
                    "BC",
                  ],
                  [
                    "Javier E.",
                    "La experiencia en la tienda web es súper intuitiva y el seguimiento en tiempo real funciona de diez. Me resolvieron una duda sobre fechas de vencimiento en segundos por chat.",
                    "JE",
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
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-5xl px-4 py-12 sm:px-6"
            >
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
            </motion.section>

            {/* Contactos Section (Apple Liquid Glass 2026) */}
            <motion.section
              id="contactos"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="scroll-mt-24 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-2xl mx-auto mb-12"
              >
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
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Contact Cards Pods */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-5 space-y-4"
                >
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
                </motion.div>

                {/* Interactive Contact Form (Frosted Glass Container) */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-7 rounded-[36px] liquid-glass p-7 sm:p-10 shadow-[0_20px_50px_-15px_rgba(20,83,45,0.08)]"
                >
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
                </motion.div>
              </div>
            </motion.section>
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
        currentUser={currentUser}
        onOpenAuth={() => {
          setIntendedAuthNotice("");
          navigateTo("auth");
        }}
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
        onClick={() => {
          if (!currentUser) {
            setIntendedAuthNotice("Para comprar y tramitar tu pedido por WhatsApp debes iniciar sesión.");
            navigateTo("auth");
          } else {
            setWhatsAppModalOpen(true);
          }
        }}
        cartCount={cartCount}
      />

      {/* WhatsApp Order Modal */}
      <WhatsAppOrderModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        cart={cart}
        onClearCart={() => setCart({})}
        currentUser={currentUser}
        onRequireLogin={() => {
          setIntendedAuthNotice("Para tramitar tu pedido por WhatsApp debes iniciar sesión o registrarte.");
          navigateTo("auth");
        }}
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
                {!currentUser && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-start gap-2 shadow-2xs">
                    <ShieldAlert className="size-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Acceso requerido para comprar</p>
                      <p className="text-[11px] text-amber-800/90 mt-0.5">
                        Inicia sesión o regístrate para tramitar tu compra y envíos en 24h.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="mt-3.5 h-13 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 liquid-glass-button active:scale-95"
                >
                  <WhatsAppIcon className="size-5" />
                  <span>
                    {currentUser
                      ? `Confirmar y Pedir (${(cartTotal >= 35 ? cartTotal : cartTotal + 3.5).toFixed(2)}$)`
                      : "Iniciar Sesión para Comprar"}
                  </span>
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

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onSearchQuery={(voiceQuery) => {
          setQuery(voiceQuery);
          navigateTo("tienda");
        }}
        onNavigateToCategory={(catId) => {
          navigateTo("tienda", catId);
        }}
        onNavigateToOffers={() => {
          navigateTo("tienda");
        }}
        onNavigateToStore={() => {
          navigateTo("tienda");
        }}
      />
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
