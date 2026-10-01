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
  CreditCard,
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
import { WhatsAppInquiryModal } from "@/components/WhatsAppInquiryModal";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";
import { AuthPage } from "@/components/AuthPage";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminProtectedRoute, AdminRouteGuard } from "@/components/admin/AdminProtectedRoute";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { VoiceSearchModal } from "@/components/VoiceSearchModal";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { ToastProvider, useToast } from "@/components/ui/ToastContext";
import { BlurUpImage } from "@/components/BlurUpImage";
import { CategoryBento } from "@/components/CategoryBento";
import { UserProfile } from "@/lib/auth";
import { supabase, mapSupabaseUserToProfile } from "@/lib/supabase";
import {
  Fingerprint,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  ShieldCheck as ShieldCheckIcon,
} from "lucide-react";
import {
  CategoryId,
  ProductItem,
  CategoryInfo,
} from "@/data/products";
import {
  getProductItems,
  getCategories,
  mapCategoryFromDatabase,
  getCart as getDbCart,
  updateCartItem as updateDbCart,
  removeFromCart as removeDbCart,
  clearCart as clearDbCart,
  syncLocalCartToSupabase,
  getFavorites as getDbFavorites,
  addFavorite as addDbFavorite,
  removeFavorite as removeDbFavorite,
  subscribeNewsletter,
  sendContactMessage,
  getProfile,
  checkIsAdmin,
} from "@/services";
import heroImage from "@/assets/condirico-hero.jpg";
import productsImage from "@/assets/condirico-products.jpg";
import promoImage from "@/assets/condirico-promo.jpg";

const categoryIconMap: Record<string, React.ElementType> = {
  alimentos: UtensilsCrossed,
  "primera-necesidad": ShoppingBasket,
  limpieza: Sparkles,
  utiles: Home,
  despensa: StoreIcon,
  frescos: Leaf,
  lacteos: ShoppingBasket,
  bebidas: UtensilsCrossed,
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

export function StockBadge({ stockQuantity, stock }: { stockQuantity?: number; stock?: number }) {
  const qty = stockQuantity ?? stock ?? 10;
  if (qty <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-black text-rose-700 dark:text-rose-400 backdrop-blur-md shadow-2xs shrink-0">
        <span className="size-1.5 rounded-full bg-rose-500" />
        <span>Agotado</span>
      </span>
    );
  }
  if (qty <= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-black text-amber-800 dark:text-amber-300 backdrop-blur-md shadow-2xs shrink-0">
        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>Pocas unidades ({qty})</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-black text-emerald-800 dark:text-emerald-300 backdrop-blur-md shadow-2xs shrink-0">
      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span>En stock</span>
    </span>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<"inicio" | "tienda" | "auth" | "admin">("inicio");
  const { showCartToast, showSuccessToast } = useToast();
  const [targetCategory, setTargetCategory] = useState<CategoryId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  
  // Real Dynamic Data from Supabase - Zero simulation
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppInquiryOpen, setWhatsAppInquiryOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [intendedAuthNotice, setIntendedAuthNotice] = useState<string>("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterNotice, setNewsletterNotice] = useState<string | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactNotice, setContactNotice] = useState<string | null>(null);
  const [isSendingContact, setIsSendingContact] = useState(false);
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

  // 1. Fetch real dynamic products & categories directly from Supabase
  const fetchCatalogData = async () => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      const [fetchedProds, fetchedCats] = await Promise.all([
        getProductItems(),
        getCategories(),
      ]);

      setProducts(fetchedProds || []);

      if (fetchedCats && fetchedCats.length > 0) {
        const mappedCats = fetchedCats.map((c) => {
          const count = (fetchedProds || []).filter((p) => p.category === c.id).length;
          return mapCategoryFromDatabase(c, count);
        });
        setCategories(mappedCats);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("[App] Failed to fetch catalog from Supabase:", err);
      setProductsError("No pudimos conectar con Supabase para cargar el catálogo.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();

    // Subscribe to real-time changes on categories & products in Supabase
    const catalogChannel = supabase
      .channel("catalog-realtime-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          fetchCatalogData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchCatalogData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(catalogChannel);
    };
  }, []);

  // 1b. Listen for Supabase Auth state changes and sync authoritative session
  useEffect(() => {
    // Initial session hydration
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = mapSupabaseUserToProfile(session.user);
        try {
          const dbProfile = await getProfile(session.user.id);
          if (dbProfile?.role) {
            profile.role = dbProfile.role;
          } else {
            const isAdmin = await checkIsAdmin(session.user.id);
            if (isAdmin) profile.role = "admin";
            else if (!profile.role) profile.role = "customer";
          }
        } catch (err) {
          console.warn("[App] Initial auth role fetch error:", err);
        }
        setCurrentUser(profile);

        // Automatically redirect admin to dashboard if accessing auth or home
        if (profile.role === "admin") {
          const currentHash = window.location.hash;
          if (currentHash === "#auth" || currentHash === "" || currentHash === "#inicio") {
            navigateTo("admin");
          }
        }
      } else {
        setCurrentUser(null);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = mapSupabaseUserToProfile(session.user);
          try {
            const dbProfile = await getProfile(session.user.id);
            if (dbProfile?.role) {
              profile.role = dbProfile.role;
            } else {
              const isAdmin = await checkIsAdmin(session.user.id);
              if (isAdmin) profile.role = "admin";
              else if (!profile.role) profile.role = "customer";
            }
          } catch (err) {
            console.warn("[App] Auth change role fetch error:", err);
          }
          setCurrentUser(profile);

          if (profile.role === "admin") {
            const currentHash = window.location.hash;
            if (currentHash === "#auth" || currentHash === "" || currentHash === "#inicio") {
              navigateTo("admin");
            }
          }

          if (event === "USER_UPDATED") {
            showSuccessToast("¡Cuenta actualizada!", `Tus datos han sido actualizados.`);
          }
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
          setCart({});
          setFavorites(new Set());
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Synchronize authenticated user's cart and favorites with Supabase
  useEffect(() => {
    if (currentUser?.id) {
      // Sync Cart
      getDbCart(currentUser.id).then((remoteCart) => {
        if (remoteCart && Object.keys(remoteCart).length > 0) {
          setCart(remoteCart);
        } else if (Object.keys(cart).length > 0) {
          syncLocalCartToSupabase(currentUser.id, cart).then((merged) => {
            setCart(merged);
          });
        }
      });

      // Sync Favorites
      getDbFavorites(currentUser.id).then((favIds) => {
        if (favIds && favIds.length > 0) {
          setFavorites(new Set(favIds));
        }
      });
    }
  }, [currentUser?.id]);

  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroBgY = useTransform(heroScrollProgress, [0, 1], ["0%", "28%"]);
  const heroBgScale = useTransform(heroScrollProgress, [0, 1], [1, 1.15]);
  const heroTextY = useTransform(heroScrollProgress, [0, 1], ["0%", "14%"]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.startsWith("#admin") || path.startsWith("/admin")) {
        setCurrentPage("admin");
      } else if (hash.startsWith("#tienda")) {
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
  const cartTotal = products.reduce(
    (sum, product) => sum + product.price * (cart[product.id] ?? 0),
    0
  );

  const recentProducts = useMemo(() => {
    // 6 productos más recientes desde la tabla en Supabase (public.products)
    const sorted = [...products].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 6);
    if (!query) return sorted;
    return sorted.filter((product) =>
      `${product.name} ${product.detail} ${product.category}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [products, query]);

  const featuredProducts = recentProducts;

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
      const isFav = next.has(id);
      if (isFav) {
        next.delete(id);
        if (currentUser?.id) {
          removeDbFavorite(currentUser.id, id).catch(console.warn);
        }
      } else {
        next.add(id);
        if (currentUser?.id) {
          addDbFavorite(currentUser.id, id).catch(console.warn);
        }
      }
      return next;
    });

  const changeCart = (id: number, amount: number) => {
    setCart((current) => {
      const next = Math.max(0, (current[id] ?? 0) + amount);
      const updated = { ...current, [id]: next };
      if (!next) delete updated[id];

      // Sync with Supabase cart_items in background if authenticated
      if (currentUser?.id) {
        if (next > 0) {
          updateDbCart(currentUser.id, id, next).catch(console.warn);
        } else {
          removeDbCart(currentUser.id, id).catch(console.warn);
        }
      }

      return updated;
    });

    if (amount > 0) {
      const prod = products.find((p) => p.id === id);
      if (prod) {
        showCartToast(
          { name: prod.name, image: prod.imageUrl || undefined, price: prod.price },
          amount,
          () => setCartOpen(true)
        );
      }
    }
  };

  const handleClearCart = () => {
    setCart({});
    if (currentUser?.id) {
      clearDbCart(currentUser.id).catch(console.warn);
    }
  };

  const navigateTo = (page: "inicio" | "tienda" | "auth" | "admin", categoryId?: CategoryId) => {
    setCurrentPage(page);
    setMenuOpen(false);
    setUserDropdownOpen(false);
    if (page === "admin") {
      window.location.hash = "#admin";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (page === "tienda") {
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[handleLogout] Error signing out from Supabase:", err);
    }
    setCurrentUser(null);
    setUserDropdownOpen(false);
    setCart({});
    setFavorites(new Set());
  };

  const handleSuccessAuth = async (user: UserProfile) => {
    let finalUser: UserProfile = { ...user };
    try {
      const dbProfile = await getProfile(user.id);
      if (dbProfile?.role) {
        finalUser.role = dbProfile.role;
      } else {
        const isAdmin = await checkIsAdmin(user.id);
        if (isAdmin) finalUser.role = "admin";
        else if (!finalUser.role) finalUser.role = "customer";
      }
    } catch (err) {
      console.warn("[handleSuccessAuth] Error verifying user role from Supabase:", err);
    }

    setCurrentUser(finalUser);

    // Role-based automatic dashboard redirection
    if (finalUser.role === "admin") {
      navigateTo("admin");
    } else if (intendedAuthNotice) {
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

  // Newsletter Submission Handler connected with Supabase public.newsletter_subscribers
  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    const res = await subscribeNewsletter(newsletterEmail);
    setNewsletterNotice(res.message);
    if (res.success) {
      setSubscribed(true);
      setNewsletterEmail("");
    }
  };

  // Contact Form Submission Handler connected with Supabase public.contact_messages
  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSendingContact(true);
    setContactNotice(null);

    const res = await sendContactMessage({
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone,
      topic: contactForm.topic,
      message: contactForm.message,
    });

    setIsSendingContact(false);
    if (res.success) {
      setContactSubmitted(true);
      setContactNotice(res.message);
      setContactForm({
        name: "",
        email: "",
        phone: "",
        topic: "Consulta sobre un pedido",
        message: "",
      });
    } else {
      setContactNotice(res.message);
    }
  };

  if (currentPage === "admin") {
    return (
      <AdminRouteGuard
        currentUser={currentUser}
        onNavigateHome={() => navigateTo("inicio")}
        onNavigateLogin={(notice?: string) => {
          setIntendedAuthNotice(
            notice || "Inicia sesión para ingresar al panel de administración."
          );
          navigateTo("auth");
        }}
        redirectTo="login"
      >
        <AdminDashboard
          currentUser={currentUser}
          onNavigateHome={() => navigateTo("inicio")}
          onNavigateLogin={() => {
            setIntendedAuthNotice("Inicia sesión para ingresar al panel de administración.");
            navigateTo("auth");
          }}
          onLogout={handleLogout}
        />
      </AdminRouteGuard>
    );
  }

  return (
    <div id="inicio" className="relative min-h-screen w-full max-w-full overflow-x-hidden text-foreground flex flex-col selection:bg-sun selection:text-brand-deep pb-24 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/80 backdrop-blur-xl shadow-xs transition-all">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Brand onClick={() => navigateTo("inicio")} />

          {/* Desktop Navigation */}
          <nav className="mx-auto hidden items-center gap-1.5 text-[13px] font-semibold lg:flex p-1 rounded-full border border-border bg-white/60 backdrop-blur-xl shadow-2xs">
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
              className="px-3.5 py-1.5 rounded-full text-foreground hover:bg-white/70 hover:text-primary transition-all duration-300 active:scale-95"
            >
              Ofertas
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
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigateTo("auth");
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
                          navigateTo("admin");
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors mb-1"
                      >
                        <ShieldCheckIcon className="size-3.5 text-emerald-600" />
                        <span>Panel Administrativo</span>
                      </button>
                      {currentUser.hasBiometrics ? (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700 px-2 py-1">
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
                          className="mt-1 text-[10px] font-bold text-primary hover:underline flex items-center gap-1 px-2 py-1"
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

              {categories.map((cat) => (
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
            currentUser={currentUser}
            onSuccessAuth={handleSuccessAuth}
            onLogout={handleLogout}
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
            productsList={products}
            categoriesList={categories}
            isLoading={isLoadingProducts}
            error={productsError}
            onRefresh={fetchCatalogData}
          />
        ) : (
          <div>
            {/* Hero Section: Editorial with True Background & Foreground Parallax */}
            <section
              ref={heroRef}
              className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24"
            >
              {/* Parallax Background Media Layer */}
              <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <motion.div
                  style={{ y: heroBgY, scale: heroBgScale }}
                  className="absolute -inset-x-0 -top-[15%] h-[135%] w-full will-change-transform"
                >
                  <img
                    src={heroImage}
                    width={1536}
                    height={1024}
                    alt="Abastecimiento y productos frescos CondiRico"
                    className="h-full w-full object-cover object-[center_35%]"
                  />
                  {/* Frosted Editorial Glass & Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F8F7F2] via-[#F8F7F2]/90 to-[#F8F7F2]/55 backdrop-blur-[2px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#F8F7F2] via-transparent to-[#F8F7F2]/75" />
                </motion.div>
              </div>

              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
                <div className="max-w-2xl">
                  <motion.div
                    style={{ y: heroTextY }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-primary mb-3 sm:mb-4">
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span>Calidad · Frescura · Confianza</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-deep leading-[1.12] text-balance">
                      Todo lo que necesitas.{" "}
                      <span className="text-primary block mt-1">En un solo lugar.</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="mt-3 sm:mt-5 text-sm sm:text-base lg:text-lg text-muted-foreground max-w-lg leading-relaxed font-normal">
                      Productos frescos, enlatados y de primera necesidad para tu hogar y tu negocio.
                    </p>

                    {/* Action CTAs */}
                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                      {/* Primary CTA */}
                      <button
                        type="button"
                        onClick={() => setWhatsAppInquiryOpen(true)}
                        className="min-h-[48px] h-12 w-full sm:w-auto px-6 sm:px-7 rounded-full bg-[#075B3A] hover:bg-primary text-white text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                      >
                        <WhatsAppIcon className="size-4.5" />
                        <span>Solicitar información</span>
                      </button>

                      {/* Secondary CTA */}
                      <button
                        type="button"
                        onClick={() => navigateTo("tienda")}
                        className="min-h-[48px] h-12 w-full sm:w-auto px-6 sm:px-7 rounded-full bg-white hover:bg-white text-brand-deep border border-border shadow-2xs text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:border-[#CBD5CE] active:scale-95 cursor-pointer"
                      >
                        <span>Ver productos</span>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Clean Stats Bar */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 mx-auto -mt-6 max-w-4xl px-4 sm:px-6"
            >
              <div className="grid grid-cols-3 divide-x divide-border rounded-2xl sm:rounded-3xl bg-white/95 border border-border px-3 sm:px-10 py-4 sm:py-5 shadow-xs">
                {[
                  ["+1.5K", "Productos"],
                  ["24h", "Entrega rápida"],
                  ["4.9", "Valoración"],
                ].map(([value, label], idx) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="text-center px-1"
                  >
                    <strong className="block text-xl sm:text-3xl font-extrabold text-primary tracking-tight">
                      {value}
                    </strong>
                    <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground block leading-tight mt-0.5">
                      {label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Category Vectorial Icon Showcase: Dynamic Real Supabase Data */}
            <CategoryBento
              onSelectCategory={(categoryId) => navigateTo("tienda", categoryId)}
              onExploreAll={() => navigateTo("tienda")}
            />

            {/* Featured Products Bento Grid */}
            <motion.section
              id="destacados"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative py-12 sm:py-16 lg:py-20 overflow-hidden"
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header & Title */}
                <SectionTitle
                  eyebrow="Últimas novedades"
                  title="Productos más recientes"
                  align="left"
                />

                {/* Filter Search Bar */}
                <div className="relative mt-6 max-w-md sm:max-w-lg">
                  <Search className="absolute left-3.5 sm:left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Filtrar productos recientes..."
                    aria-label="Buscar productos recientes"
                    className="h-11 sm:h-12 w-full rounded-full border border-border bg-white pl-10 sm:pl-11 pr-20 text-xs sm:text-sm outline-none shadow-2xs transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query ? (
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground active:scale-90 cursor-pointer"
                        onClick={() => setQuery("")}
                        aria-label="Borrar búsqueda"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                    <VoiceSearchButton
                      onClick={() => setVoiceModalOpen(true)}
                      ariaLabel="Buscar recientes por voz"
                    />
                  </div>
                </div>

                {/* Bento Grid Stage */}
                {isLoadingProducts && recentProducts.length === 0 ? (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 auto-rows-auto sm:auto-rows-[280px]">
                    {[...Array(6)].map((_, idx) => (
                      <div
                        key={idx}
                        className={`rounded-2xl sm:rounded-3xl bg-white border border-border p-5 sm:p-6 animate-pulse space-y-4 min-h-[260px] sm:min-h-0 ${
                          idx === 0 ? "sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2" : ""
                        }`}
                      >
                        <div className="h-full rounded-2xl bg-black/5 min-h-[200px]" />
                      </div>
                    ))}
                  </div>
                ) : recentProducts.length > 0 ? (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6 auto-rows-auto sm:auto-rows-[280px]">
                    {recentProducts.map((product, idx) => {
                      const inCart = cart[product.id] ?? 0;
                      const isFav = favorites.has(product.id);

                      // Determine Bento Grid Layout Spans based on index
                      let gridSpanClass = "sm:col-span-1 sm:row-span-1";
                      if (idx === 0) {
                        gridSpanClass = "sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2";
                      } else if (idx === 1) {
                        gridSpanClass = "sm:col-span-1 sm:row-span-2 lg:col-span-1 lg:row-span-2";
                      } else if (idx === 5) {
                        gridSpanClass = "sm:col-span-2 lg:col-span-3 lg:row-span-1";
                      }

                      if (idx === 0) {
                        // Flagship Hero Bento Card (2x2)
                        return (
                          <motion.article
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.3 }}
                            className={`group relative ${gridSpanClass} overflow-hidden rounded-2xl sm:rounded-3xl flagship-glassmorphic-card p-5 sm:p-7 flex flex-col justify-between`}
                          >
                            <div className="flex items-center justify-between gap-2 z-10">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                                  <span>{product.badge || "Recién Llegado"}</span>
                                </span>
                                <StockBadge stockQuantity={product.stockQuantity} stock={product.stock} />
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleFavorite(product.id)}
                                className="grid size-10 place-items-center rounded-full bg-white border border-border shadow-2xs hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
                                aria-label="Agregar a favoritos"
                              >
                                <Heart className={`size-4 ${isFav ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-4 z-10">
                              <div>
                                <span className="text-xs font-black uppercase text-primary tracking-wider">
                                  {product.unit} • Selección Fresca
                                </span>
                                <h3 className="text-xl sm:text-3xl font-black text-brand-deep mt-1 leading-tight group-hover:text-primary transition-colors">
                                  {product.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 line-clamp-2">
                                  {product.detail || "Calidad superior garantizada en CondiRico."}
                                </p>
                                
                                <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
                                  <span className="text-2xl sm:text-4xl font-black text-brand-deep">
                                    ${product.price.toFixed(2)}
                                  </span>
                                  {product.oldPrice && (
                                    <span className="text-xs sm:text-sm text-muted-foreground line-through">
                                      ${product.oldPrice.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="relative aspect-square w-full max-w-[170px] sm:max-w-[220px] mx-auto rounded-2xl sm:rounded-3xl overflow-hidden bg-white/80 border border-white/90 shadow-lg group-hover:scale-105 transition-transform duration-500">
                                {product.imageUrl ? (
                                  <BlurUpImage
                                    src={product.imageUrl}
                                    alt={product.name}
                                    priority={true}
                                    className="size-full object-cover"
                                    fallbackIcon={<ShoppingBasket className="size-16 text-primary/70" />}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-emerald-500/10">
                                    <ShoppingBasket className="size-16 text-primary/70" />
                                  </div>
                                )}
                                <div className="absolute left-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-brand-deep shadow-xs backdrop-blur-md z-10">
                                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                  <span>{product.rating}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-border z-10">
                              <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
                                Código #{product.id}
                              </span>
                              <button
                                type="button"
                                onClick={() => changeCart(product.id, 1)}
                                className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-full text-xs font-bold shadow-sm transition-all active:scale-95 hover:scale-105 cursor-pointer ${
                                  inCart > 0
                                    ? "bg-offer text-offer-foreground shadow-offer/20"
                                    : "bg-primary text-primary-foreground shadow-primary/30"
                                }`}
                              >
                                <Plus className="size-4" />
                                <span>{inCart > 0 ? `En carrito (${inCart})` : "Agregar al Carrito"}</span>
                              </button>
                            </div>
                          </motion.article>
                        );
                      }

                      if (idx === 1) {
                        // Tall Bento Card (1x2)
                        return (
                          <motion.article
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.3, delay: 0.05 }}
                            className={`group relative ${gridSpanClass} overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-border shadow-xs hover:shadow-md p-5 sm:p-6 flex flex-col justify-between transition-all`}
                          >
                            <div className="flex items-center justify-between gap-2 z-10">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                                Novedad
                              </span>
                              <div className="flex items-center gap-1.5">
                                <StockBadge stockQuantity={product.stockQuantity} stock={product.stock} />
                                <button
                                  type="button"
                                  onClick={() => toggleFavorite(product.id)}
                                  className="grid size-10 place-items-center rounded-full bg-white border border-border shadow-2xs hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
                                  aria-label="Agregar a favoritos"
                                >
                                  <Heart className={`size-4 ${isFav ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                                </button>
                              </div>
                            </div>

                            <div className="relative aspect-square w-full my-auto rounded-xl overflow-hidden bg-muted/40 border border-border shadow-2xs group-hover:scale-102 transition-transform duration-300 z-10">
                              {product.imageUrl ? (
                                <BlurUpImage
                                  src={product.imageUrl}
                                  alt={product.name}
                                  priority={false}
                                  className="size-full object-cover"
                                  fallbackIcon={<ShoppingBasket className="size-12 text-primary/70" />}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-emerald-500/10">
                                  <ShoppingBasket className="size-12 text-primary/70" />
                                </div>
                              )}
                              <span className="absolute left-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-brand-deep shadow-2xs z-10">
                                <Star className="size-3 fill-amber-400 text-amber-400" />
                                <span>{product.rating}</span>
                              </span>
                            </div>

                            <div className="z-10">
                              <h3 className="font-bold text-base text-brand-deep line-clamp-1 group-hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.detail}</p>
                              
                              <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-border">
                                <strong className="text-lg font-extrabold text-brand-deep">${product.price.toFixed(2)}</strong>
                                <button
                                  type="button"
                                  onClick={() => changeCart(product.id, 1)}
                                  className={`grid size-10 place-items-center rounded-full shadow-xs active:scale-90 transition-all hover:scale-105 cursor-pointer ${
                                    inCart > 0 ? "bg-offer text-offer-foreground" : "bg-primary text-primary-foreground"
                                  }`}
                                  aria-label="Agregar al carrito"
                                >
                                  <Plus className="size-4" />
                                </button>
                              </div>
                            </div>
                          </motion.article>
                        );
                      }

                      if (idx === 5) {
                        // Wide Banner Bento Card (3x1)
                        return (
                          <motion.article
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className={`group relative ${gridSpanClass} overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-border shadow-xs hover:shadow-md p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 transition-all`}
                          >
                            <div className="flex items-center gap-3.5 sm:gap-4 z-10 w-full sm:w-auto">
                              <div className="relative size-16 sm:size-18 rounded-xl overflow-hidden bg-muted/40 border border-border shadow-2xs shrink-0 group-hover:scale-102 transition-transform duration-300">
                                {product.imageUrl ? (
                                  <BlurUpImage
                                    src={product.imageUrl}
                                    alt={product.name}
                                    priority={false}
                                    className="size-full object-cover"
                                    fallbackIcon={<ShoppingBasket className="size-8 text-primary/70" />}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-emerald-500/10">
                                    <ShoppingBasket className="size-8 text-primary/70" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-primary tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                                    Novedad
                                  </span>
                                  <StockBadge stockQuantity={product.stockQuantity} stock={product.stock} />
                                </div>
                                <h3 className="font-bold text-base sm:text-lg text-brand-deep group-hover:text-primary transition-colors mt-0.5">
                                  {product.name}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-1">{product.detail}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 w-full sm:w-auto z-10 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">{product.unit}</span>
                                <strong className="text-lg sm:text-xl font-extrabold text-brand-deep">${product.price.toFixed(2)}</strong>
                              </div>
                              <button
                                type="button"
                                onClick={() => changeCart(product.id, 1)}
                                className={`inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2 rounded-full text-xs font-bold shadow-xs transition-all active:scale-95 hover:scale-102 cursor-pointer ${
                                  inCart > 0 ? "bg-offer text-offer-foreground" : "bg-primary text-primary-foreground"
                                }`}
                              >
                                <Plus className="size-4" />
                                <span>{inCart > 0 ? `(${inCart})` : "Agregar"}</span>
                              </button>
                            </div>
                          </motion.article>
                        );
                      }

                      // Standard Square Bento Cards (idx 2, 3, 4)
                      return (
                        <motion.article
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          whileHover={{ y: -3 }}
                          transition={{ duration: 0.3, delay: idx * 0.04 }}
                          className={`group relative ${gridSpanClass} overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-border shadow-xs hover:shadow-md p-4 sm:p-5 flex flex-col justify-between transition-all`}
                        >
                          <div className="flex items-start justify-between gap-2.5 z-10">
                            <div className="relative size-16 rounded-xl overflow-hidden bg-muted/40 border border-border shadow-2xs shrink-0 group-hover:scale-102 transition-transform duration-300">
                              {product.imageUrl ? (
                                <BlurUpImage
                                  src={product.imageUrl}
                                  alt={product.name}
                                  priority={false}
                                  className="size-full object-cover"
                                  fallbackIcon={<ShoppingBasket className="size-6 text-primary/70" />}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-emerald-500/10">
                                  <ShoppingBasket className="size-6 text-primary/70" />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <button
                                type="button"
                                onClick={() => toggleFavorite(product.id)}
                                className="grid size-9 place-items-center rounded-full bg-white border border-border shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                aria-label="Agregar a favoritos"
                              >
                                <Heart className={`size-4 ${isFav ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                              </button>
                              <StockBadge stockQuantity={product.stockQuantity} stock={product.stock} />
                            </div>
                          </div>

                          <div className="my-2 z-10">
                            <h3 className="font-bold text-sm text-brand-deep line-clamp-1 group-hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.detail}</p>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border z-10">
                            <div>
                              <span className="text-[10px] text-muted-foreground block font-bold">{product.unit}</span>
                              <strong className="text-base font-extrabold text-brand-deep">${product.price.toFixed(2)}</strong>
                            </div>
                            <button
                              type="button"
                              onClick={() => changeCart(product.id, 1)}
                              className={`grid size-9 place-items-center rounded-full shadow-xs active:scale-90 transition-all hover:scale-105 cursor-pointer ${
                                inCart > 0 ? "bg-offer text-offer-foreground" : "bg-primary text-primary-foreground"
                              }`}
                              aria-label="Agregar al carrito"
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="mt-8 py-12 text-center rounded-2xl sm:rounded-3xl bg-white border border-border max-w-lg mx-auto p-6 sm:p-8 shadow-xs">
                    <div className="grid size-14 mx-auto place-items-center rounded-2xl bg-amber-500/10 text-amber-600 mb-3 border border-amber-500/20">
                      <ShoppingBasket className="size-7" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-deep">Catálogo Vacío</h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                      {query
                        ? `No se encontraron productos que coincidan con "${query}".`
                        : "no existen productos disponibles en la tienda"}
                    </p>
                    {query ? (
                      <Button
                        variant="outline"
                        onClick={() => setQuery("")}
                        className="mt-4 rounded-full text-xs font-bold"
                      >
                        Limpiar búsqueda
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground/80 mt-2">
                        Puedes agregar nuevos productos en tiempo real desde el panel administrativo (/admin).
                      </p>
                    )}
                  </div>
                )}

                {/* Bottom Store Link */}
                <div className="mt-10 sm:mt-12 text-center">
                  <button
                    type="button"
                    onClick={() => navigateTo("tienda")}
                    className="rounded-full bg-primary hover:bg-primary/95 px-8 py-3.5 text-xs font-bold text-primary-foreground shadow-sm active:scale-95 inline-flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <StoreIcon className="size-4" />
                    <span>Explorar catálogo completo en la Tienda</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Weekly Promo Banner */}
            <motion.section
              id="ofertas"
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
            >
              <div className="relative min-h-[380px] overflow-hidden rounded-3xl sm:rounded-[32px] border border-border shadow-xs">
                <div className="relative min-h-[380px] rounded-3xl overflow-hidden bg-brand-deep">
                  <img
                    src={promoImage}
                    loading="lazy"
                    width={1536}
                    height={768}
                    alt="Compra semanal con alimentos y productos del hogar"
                    className="absolute inset-0 h-full w-full object-cover object-[64%_center]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/95 via-brand-deep/80 to-transparent" />
                  <div className="relative flex min-h-[380px] max-w-xl flex-col justify-center p-8 text-primary-foreground sm:p-14">
                    <span className="w-fit rounded-full bg-sun px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-deep shadow-2xs">
                      Oferta de la semana
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                      Llena tu carrito.
                      <br />
                      <span className="text-sun">Ahorra en grande.</span>
                    </h2>
                    <p className="mt-3 max-w-sm text-sm sm:text-base leading-relaxed text-primary-foreground/85">
                      Hasta 30% de descuento en productos seleccionados de despensa y aseo.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateTo("tienda")}
                      className="mt-6 w-fit rounded-full bg-offer hover:bg-offer/95 px-7 py-3 font-bold text-offer-foreground text-sm shadow-md active:scale-95 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <span>Ver ofertas en la Tienda</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Benefits */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="py-12 sm:py-16 lg:py-20"
            >
              <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3.5 sm:gap-5 px-4 sm:px-6 md:grid-cols-5 lg:px-8">
                {benefits.map(({ icon: Icon, title, text }, index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -3 }}
                    className={`flex flex-col items-center rounded-2xl sm:rounded-3xl bg-white border border-border p-5 sm:p-6 text-center shadow-xs transition-all hover:border-[#CBD5CE] ${
                      index === 4 ? "col-span-2 md:col-span-1" : ""
                    }`}
                  >
                    <div className="grid size-12 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-primary shadow-2xs">
                      <Icon className="size-5 sm:size-6" />
                    </div>
                    <h3 className="mt-3.5 text-sm font-bold text-foreground">{title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Testimonials */}
            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 mb-8">
                <SectionTitle
                  eyebrow="Clientes felices"
                  title="Lo que dicen de nosotros"
                  align="left"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-full border border-border bg-white text-foreground shadow-2xs active:scale-90 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => scroll(testimonialRail, -1)}
                    aria-label="Testimonio anterior"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-full border border-border bg-white text-foreground shadow-2xs active:scale-90 hover:bg-muted cursor-pointer transition-colors"
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

            {/* Newsletter */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20"
            >
              <div className="rounded-3xl sm:rounded-[32px] bg-white border border-border p-6 sm:p-12 text-center shadow-xs">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 border border-amber-200 text-offer shadow-2xs">
                  <Mail className="size-5 sm:size-6" />
                </span>
                <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-brand-deep tracking-tight">
                  Ofertas frescas en tu correo
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Suscríbete y recibe cupones de descuento exclusivos, novedades y ofertas de temporada.
                </p>
                {subscribed ? (
                  <p className="mt-6 font-bold text-primary animate-in fade-in">
                    ¡Listo! Pronto recibirás nuestras mejores ofertas.
                  </p>
                ) : (
                  <form
                    className="mx-auto mt-6 flex max-w-md flex-col gap-2.5 sm:flex-row"
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
                      className="h-11 sm:h-12 min-w-0 flex-1 rounded-full border border-border bg-muted/30 px-5 text-sm outline-none transition-all focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                    />
                    <button
                      type="submit"
                      className="h-11 sm:h-12 rounded-full bg-primary hover:bg-primary/95 px-7 text-xs font-bold text-primary-foreground shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      Suscribirme
                    </button>
                  </form>
                )}
              </div>
            </motion.section>

            {/* Contactos Section */}
            <motion.section
              id="contactos"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="scroll-mt-24 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
            >
              <div className="mb-10">
                <SectionTitle
                  eyebrow="Atención directa y cercana"
                  title="Contáctanos"
                  subtitle="¿Tienes alguna duda sobre tu compra, entregas, sugerencias o requieres atención personalizada? Nuestro equipo está listo para ayudarte todos los días."
                  align="center"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                {/* Contact Cards */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-5 space-y-3.5"
                >
                  <div className="rounded-2xl sm:rounded-3xl bg-white border border-border p-5 sm:p-6 flex items-start gap-4 shadow-xs">
                    <div className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0 shadow-2xs">
                      <Phone className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Teléfono & WhatsApp</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">Atención inmediata con un asesor</p>
                      <a href="tel:+18002663474" className="mt-1.5 inline-block text-sm font-bold text-primary hover:underline">
                        +1 800 CONDI RICO (266-3474)
                      </a>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Lunes a Domingo: 8:00 AM – 8:00 PM</p>
                      <button
                        type="button"
                        onClick={() => setWhatsAppInquiryOpen(true)}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        <WhatsAppIcon className="size-3.5" />
                        <span>Consultar por WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl sm:rounded-3xl bg-white border border-border p-5 sm:p-6 flex items-start gap-4 shadow-xs">
                    <div className="grid size-11 place-items-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 shrink-0 shadow-2xs">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Correo Electrónico</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">Escríbenos para soporte, pedidos o facturación</p>
                      <a href="mailto:hola@condirico.com" className="mt-1.5 inline-block text-sm font-bold text-primary hover:underline">
                        hola@condirico.com
                      </a>
                      <p className="text-[11px] text-muted-foreground mt-0.5">soporte@condirico.com</p>
                    </div>
                  </div>

                  <div className="rounded-2xl sm:rounded-3xl bg-white border border-border p-5 sm:p-6 flex items-start gap-4 shadow-xs">
                    <div className="grid size-11 place-items-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 shrink-0 shadow-2xs">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Centro de Distribución & Tienda</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">Av. Principal Los Jardines #450, Ciudad Central</p>
                      <p className="mt-1.5 text-xs font-semibold text-teal-700">Envíos directos a todo el municipio en 24h</p>
                    </div>
                  </div>

                  <div className="rounded-2xl sm:rounded-3xl bg-white border border-border p-5 sm:p-6 flex items-start gap-4 shadow-xs">
                    <div className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-orange-700 border border-orange-100 shrink-0 shadow-2xs">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Horario de Entregas</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">Reparto continuo en turnos mañana y tarde</p>
                      <p className="mt-1 text-xs font-bold text-foreground">Lunes a Domingo: 7:00 AM – 10:00 PM</p>
                    </div>
                  </div>
                </motion.div>

                {/* Contact Form */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-7 rounded-2xl sm:rounded-3xl bg-white border border-border p-6 sm:p-8 shadow-xs"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className="size-4 text-offer" />
                    <span className="text-xs font-bold uppercase tracking-wider text-offer">
                      Envíanos un mensaje directo
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-brand-deep tracking-tight">
                    ¿En qué podemos ayudarte?
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Completa el formulario y te responderemos a la brevedad posible.
                  </p>

                  {contactSubmitted ? (
                    <div className="mt-6 rounded-2xl bg-emerald-50/90 border border-emerald-200 p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                        <CheckCircle2 className="size-7" />
                      </div>
                      <h4 className="mt-3.5 text-lg font-bold text-emerald-950">
                        ¡Mensaje enviado con éxito!
                      </h4>
                      <p className="mt-1.5 text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                        Gracias por escribirnos, <strong>{contactForm.name || "estimado cliente"}</strong>. Un asesor de CondiRico revisará tu consulta y se comunicará contigo al correo en menos de 2 horas.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setContactSubmitted(false);
                          setContactForm({ name: "", email: "", phone: "", topic: "Consulta sobre un pedido", message: "" });
                        }}
                        className="mt-5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
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
                            className="h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
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
                            className="h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
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
                            className="h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">
                            Motivo de Contacto
                          </label>
                          <select
                            value={contactForm.topic}
                            onChange={(e) => setContactForm({ ...contactForm, topic: e.target.value })}
                            className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
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
                          className="w-full rounded-xl border border-border bg-white p-3.5 text-sm outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10 resize-none"
                        />
                      </div>

                      <div className="pt-1">
                        <button
                          type="submit"
                          className="w-full sm:w-auto h-11 sm:h-12 rounded-full bg-primary hover:bg-primary/95 px-8 text-xs font-bold text-primary-foreground shadow-xs active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer"
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
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
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
              {categories.map((c) => (
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
        <div className="border-t border-white/10 px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-primary-foreground/50">
          <span>© 2026 CondiRico Supermercado · Calidad, frescura y confianza para tu hogar.</span>
          <button
            type="button"
            onClick={() => navigateTo("admin")}
            className="hover:text-emerald-400 font-mono text-[11px] transition-colors flex items-center gap-1.5 text-primary-foreground/60 active:scale-95"
          >
            <ShieldCheckIcon className="size-3.5 text-emerald-400" />
            <span>Área Administrativa (/admin)</span>
          </button>
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
        categoriesList={categories}
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
        productsList={products}
        onNavigateToStore={() => {
          setSearchModalOpen(false);
          navigateTo("tienda");
        }}
      />

      {/* Floating WhatsApp Button (Inquiries and Questions Only) */}
      <FloatingWhatsAppButton
        onClick={() => setWhatsAppInquiryOpen(true)}
      />

      {/* WhatsApp Inquiry Modal for Customer Inquiries and Questions */}
      <WhatsAppInquiryModal
        isOpen={whatsAppInquiryOpen}
        onClose={() => setWhatsAppInquiryOpen(false)}
      />

      {/* WhatsApp Order Modal for Cart Checkout */}

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
                products.filter((product) => cart[product.id]).map(
                  (product) => (
                    <div
                      key={product.id}
                      className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-2xl liquid-glass-card p-3 shadow-2xs"
                    >
                      <div className="relative size-16 rounded-xl bg-white/60 border border-white/80 overflow-hidden shadow-inner">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="size-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : product.pos ? (
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

                {/* Primary Action: Online Checkout */}
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutModalOpen(true);
                  }}
                  className="mt-3.5 h-13 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 liquid-glass-button active:scale-95 cursor-pointer"
                >
                  <CreditCard className="size-5" />
                  <span>
                    Pagar con Tarjeta, PayPal o GPay (${(cartTotal >= 30 ? cartTotal : cartTotal + 3.5).toFixed(2)})
                  </span>
                </button>

                {/* Secondary Option: WhatsApp */}
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="mt-2 h-11 w-full rounded-2xl border border-emerald-300 bg-emerald-50/90 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer"
                >
                  <WhatsAppIcon className="size-4" />
                  <span>Pedir por WhatsApp</span>
                </button>

                <button
                  type="button"
                  className="mt-2 h-10 w-full rounded-2xl border border-white/80 bg-white/70 text-foreground font-bold text-xs shadow-xs hover:bg-white active:scale-95 cursor-pointer"
                  onClick={() => setCartOpen(false)}
                >
                  Seguir explorando
                </button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-600" />
                  <span>Pasarelas protegidas con cifrado bancario SSL</span>
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Professional Payments Checkout Modal (PayPal, Stripe, Google Pay) */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        cart={cart}
        productsList={products}
        currentUser={currentUser}
        onClearCart={() => setCart({})}
        onViewOrders={() => navigateTo("auth")}
      />

      {/* WhatsApp Order Modal */}
      <WhatsAppOrderModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        cart={cart}
        onClearCart={() => setCart({})}
        currentUser={currentUser}
        onRequireLogin={() => {
          setWhatsAppModalOpen(false);
          setIntendedAuthNotice("Inicia sesión para confirmar tu pedido.");
          navigateTo("auth");
        }}
        productsList={products}
      />

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
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center max-w-2xl mx-auto" : "min-w-0"}>
      <p className="text-xs font-bold uppercase tracking-wider text-offer">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-deep tracking-tight text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
