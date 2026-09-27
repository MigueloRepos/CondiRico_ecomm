import React, { useState, useRef, useMemo, useEffect, FormEvent } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sparkle,
  ArrowRight,
  Truck,
  ShieldCheck,
  PackageCheck,
  Clock3,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Search,
  X,
  Star,
  Quote,
  CheckCircle2,
  Mail,
  Send,
  MessageSquare,
  Phone,
  User,
  Heart,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { ProductItem, CategoryId, CategoryInfo } from "@/data/products";
import { subscribeNewsletter, sendContactMessage } from "@/services";

import heroImage from "@/assets/condirico-hero.jpg";
import productsImage from "@/assets/condirico-products.jpg";
import promoImage from "@/assets/condirico-promo.jpg";

interface HomePageProps {
  products: ProductItem[];
  categories: CategoryInfo[];
  favorites: Set<number>;
  cart: Record<number, number>;
  onAddToCart: (id: number, amount: number) => void;
  onToggleFavorite: (id: number) => void;
  onNavigate: (page: "inicio" | "tienda" | "auth" | "admin", categoryId?: CategoryId) => void;
  onOpenVoiceSearch: () => void;
}

const benefits = [
  { icon: Truck, title: "Envíos rápidos", text: "Recibe hoy mismo en tu puerta" },
  { icon: ShieldCheck, title: "Compra segura", text: "Tus datos 100% protegidos" },
  { icon: PackageCheck, title: "Calidad garantizada", text: "Alimentos y útiles certificados" },
  { icon: Clock3, title: "Siempre contigo", text: "Atención todos los días del año" },
  { icon: Leaf, title: "Selección fresca", text: "Lo mejor para cuidar tu hogar" },
];

export const HomePage: React.FC<HomePageProps> = ({
  products,
  categories,
  favorites,
  cart,
  onAddToCart,
  onToggleFavorite,
  onNavigate,
  onOpenVoiceSearch,
}) => {
  const [query, setQuery] = useState("");
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [isCarouselAutoPlay, setIsCarouselAutoPlay] = useState(true);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  // Newsletter form
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterNotice, setNewsletterNotice] = useState<string | null>(null);

  // Contact form
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

  const heroRef = useRef<HTMLDivElement>(null);
  const productRail = useRef<HTMLDivElement>(null);

  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroImageY = useTransform(heroScrollProgress, [0, 1], ["0%", "18%"]);
  const heroImageScale = useTransform(heroScrollProgress, [0, 1], [1, 1.08]);
  const heroTextY = useTransform(heroScrollProgress, [0, 1], ["0%", "10%"]);
  const heroFloatY1 = useTransform(heroScrollProgress, [0, 1], ["0px", "-45px"]);
  const heroFloatY2 = useTransform(heroScrollProgress, [0, 1], ["0px", "-25px"]);

  const featuredProducts = useMemo(() => {
    const base = products.filter((p) => p.isFeatured || p.isPopular);
    const list = base.length > 0 ? base : products;
    if (!query) return list;
    return list.filter((product) =>
      `${product.name} ${product.detail} ${product.category}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [products, query]);

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

  useEffect(() => {
    if (!isCarouselAutoPlay || isCarouselHovered || featuredProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveCarouselIndex((curr) => {
        const next = (curr + 1) % featuredProducts.length;
        if (productRail.current) {
          const cardEl = productRail.current.querySelector("article");
          const cardWidth = cardEl ? cardEl.getBoundingClientRect().width : 280;
          productRail.current.scrollTo({
            left: next * (cardWidth + 20),
            behavior: "smooth",
          });
        }
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isCarouselAutoPlay, isCarouselHovered, featuredProducts.length]);

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

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setContactNotice("Por favor completa los campos obligatorios.");
      return;
    }

    setIsSendingContact(true);
    const res = await sendContactMessage(contactForm);
    setIsSendingContact(false);

    if (res.success) {
      setContactSubmitted(true);
      setContactNotice("¡Mensaje enviado con éxito! Nos pondremos en contacto contigo a la brevedad.");
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

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16">
        <div className="mx-auto grid max-w-[1536px] lg:grid-cols-2 gap-8 items-center px-4 sm:px-6 lg:px-12">
          <motion.div
            style={{ y: heroTextY }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl"
          >
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
              Productos frescos, despensa completa, limpieza y artículos del hogar con entrega garantizada en 24 horas.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5">
              <button
                type="button"
                onClick={() => onNavigate("tienda")}
                className="h-13 rounded-full bg-offer px-8 font-black text-offer-foreground text-sm flex items-center gap-2.5 shadow-xl shadow-offer/30 liquid-glass-button active:scale-95 cursor-pointer"
              >
                <span>Explorar la Tienda</span>
                <ArrowRight className="size-4" />
              </button>
              <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="size-2 rounded-full bg-primary" /> Más de 1.500 productos
              </span>
            </div>
          </motion.div>

          {/* Hero Showcase Image */}
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
                alt="Bolsa de compras con alimentos frescos"
                className="absolute inset-0 h-full w-full object-cover object-[68%_center] will-change-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

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

      {/* Benefits Floating Bar */}
      <section className="relative z-10 mx-auto -mt-6 max-w-4xl px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-white/60 rounded-[28px] liquid-glass-dock px-4 py-5 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.08)]">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="flex items-center gap-3 px-3 py-1">
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{b.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Products Carousel */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-offer">
              Selección Destacada
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-brand-deep tracking-tight mt-1">
              Productos Populares
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCarouselAutoPlay(!isCarouselAutoPlay)}
              className="px-3.5 py-1.5 rounded-full border border-white/80 bg-white/70 text-xs font-bold text-muted-foreground hover:text-foreground backdrop-blur-md shadow-2xs"
            >
              {isCarouselAutoPlay ? "Pausar" : "Auto"}
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handlePrevProduct}
                className="grid size-9 place-items-center rounded-full bg-white/80 text-foreground hover:bg-white shadow-2xs active:scale-90"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={handleNextProduct}
                className="grid size-9 place-items-center rounded-full bg-white/80 text-foreground hover:bg-white shadow-2xs active:scale-90"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Cards Rail */}
        <div
          ref={productRail}
          onMouseEnter={() => setIsCarouselHovered(true)}
          onMouseLeave={() => setIsCarouselHovered(false)}
          className="mt-6 flex gap-5 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory"
        >
          {featuredProducts.map((p) => {
            const isFav = favorites.has(p.id);
            const inCart = cart[p.id] || 0;

            return (
              <article
                key={p.id}
                className="w-64 sm:w-72 shrink-0 snap-start rounded-[28px] liquid-glass p-4 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="relative aspect-4/3 rounded-2xl bg-white/60 overflow-hidden shadow-inner mb-3">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className={`size-full bg-cover ${p.pos || "bg-center"}`}
                      style={{
                        backgroundImage: `url(${productsImage})`,
                        backgroundSize: "300% 200%",
                      }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleFavorite(p.id)}
                    className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-white/80 text-muted-foreground hover:text-rose-500 shadow-2xs backdrop-blur-md active:scale-90"
                  >
                    <Heart className={`size-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>

                  {p.badge && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sun text-amber-950 shadow-2xs">
                      {p.badge}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    {p.unit}
                  </span>
                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{p.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{p.detail}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-brand-deep">${p.price.toFixed(2)}</span>
                      {p.oldPrice && (
                        <span className="ml-1.5 text-xs text-muted-foreground line-through">
                          ${p.oldPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddToCart(p.id, 1)}
                      className="h-9 px-3.5 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 cursor-pointer"
                    >
                      <ShoppingCart className="size-3.5" />
                      <span>{inCart > 0 ? `(${inCart}) +` : "Agregar"}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Newsletter & Contact Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Newsletter Box */}
          <div className="rounded-[32px] liquid-glass p-8 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-offer">
                Novedades y Ofertas
              </span>
              <h3 className="text-2xl font-black text-brand-deep tracking-tight mt-1">
                Suscríbete al Boletín CondiRico
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Recibe cupones de descuento exclusivos, alertas de nuevos productos de temporada y ofertas semanales directamente en tu correo.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="mt-6 space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="Tu correo electrónico..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="h-12 w-full rounded-full border border-white/80 bg-white/80 pl-11 pr-4 text-xs text-foreground placeholder-muted-foreground focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                />
              </div>

              {newsletterNotice && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <span>{newsletterNotice}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={subscribed}
                className="h-11 w-full rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/20"
              >
                <Send className="size-4 mr-2" />
                {subscribed ? "¡Suscrito con Éxito!" : "Unirme al Boletín"}
              </Button>
            </form>
          </div>

          {/* Contact Box */}
          <div id="contactos" className="rounded-[32px] liquid-glass p-8 shadow-xl">
            <span className="text-[11px] font-black uppercase tracking-widest text-offer">
              Atención al Cliente
            </span>
            <h3 className="text-2xl font-black text-brand-deep tracking-tight mt-1">
              ¿Tienes alguna duda o pedido especial?
            </h3>

            {contactNotice && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>{contactNotice}</span>
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre completo *"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="h-10 px-4 rounded-2xl bg-white/80 border border-white/80 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="email"
                  required
                  placeholder="Correo electrónico *"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="h-10 px-4 rounded-2xl bg-white/80 border border-white/80 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <input
                type="text"
                placeholder="Teléfono / WhatsApp (opcional)"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                className="h-10 w-full px-4 rounded-2xl bg-white/80 border border-white/80 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              <textarea
                rows={3}
                required
                placeholder="Escribe tu mensaje o consulta..."
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                className="w-full p-3.5 rounded-2xl bg-white/80 border border-white/80 text-xs text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              <Button
                type="submit"
                disabled={isSendingContact}
                className="h-11 w-full rounded-full bg-brand-deep text-white font-bold text-xs shadow-lg"
              >
                {isSendingContact ? "Enviando..." : "Enviar Mensaje"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
