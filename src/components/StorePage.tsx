import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  UtensilsCrossed,
  ShoppingBasket,
  Sparkles,
  Home as HomeIcon,
  Search,
  X,
  Heart,
  Plus,
  Minus,
  ShoppingCart,
  ArrowUp,
  Star,
  Check,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkle,
  MessageCircle,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import {
  CATEGORIES,
  ALL_PRODUCTS,
  CategoryId,
  ProductItem,
} from "@/data/products";
import { Button } from "@/components/ui/button";
import productsSprite from "@/assets/condirico-products.jpg";

interface StorePageProps {
  initialCategory?: CategoryId | null;
  cart: Record<number, number>;
  onAddToCart: (id: number, amount: number) => void;
  favorites: Set<number>;
  onToggleFavorite: (id: number) => void;
  onOpenCart: () => void;
  onOpenWhatsAppOrder?: () => void;
}

const CATEGORY_ICONS: Record<CategoryId, React.ElementType> = {
  alimentos: UtensilsCrossed,
  "primera-necesidad": ShoppingBasket,
  limpieza: Sparkles,
  utiles: HomeIcon,
};

export const StorePage: React.FC<StorePageProps> = ({
  initialCategory,
  cart,
  onAddToCart,
  favorites,
  onToggleFavorite,
  onOpenCart,
  onOpenWhatsAppOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<CategoryId | "todas">(
    initialCategory || "todas"
  );
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const sectionRefs = {
    alimentos: useRef<HTMLElement>(null),
    "primera-necesidad": useRef<HTMLElement>(null),
    limpieza: useRef<HTMLElement>(null),
    utiles: useRef<HTMLElement>(null),
  };

  useEffect(() => {
    if (initialCategory && sectionRefs[initialCategory]?.current) {
      setTimeout(() => {
        sectionRefs[initialCategory].current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [initialCategory]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = ALL_PRODUCTS.reduce(
    (sum, p) => sum + p.price * (cart[p.id] ?? 0),
    0
  );

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return ALL_PRODUCTS;
    const q = searchQuery.toLowerCase().trim();
    return ALL_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.detail.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const scrollToSection = (catId: CategoryId) => {
    setSelectedFilter("todas");
    sectionRefs[catId]?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleAddWithFeedback = (product: ProductItem) => {
    onAddToCart(product.id, 1);
    setAddedNotice(`¡${product.name} agregado al carrito!`);
    setTimeout(() => setAddedNotice(null), 2400);
  };

  return (
    <div className="relative pb-28 md:pb-20 overflow-hidden">
      {/* Volumetric Lighting Layers (Ambient Orbs behind glass) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[520px] w-[520px] rounded-full bg-emerald-300/20 blur-[130px] animate-float-slow" />
        <div className="absolute top-1/3 -right-28 h-[580px] w-[580px] rounded-full bg-amber-200/25 blur-[140px] animate-float-reverse" />
        <div className="absolute top-2/3 left-10 h-[480px] w-[480px] rounded-full bg-teal-200/20 blur-[120px] animate-float-slow" />
      </div>

      {/* Tienda Hero Header: Apple Liquid Glass Banner */}
      <section className="relative pt-8 pb-10 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-[36px] liquid-glass p-7 sm:p-12 text-center shadow-[0_25px_60px_-15px_rgba(20,83,45,0.08)]">
            {/* Subtle specular top highlight line */}
            <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-primary shadow-xs backdrop-blur-md">
              <Sparkle className="size-3.5 text-offer animate-pulse" />
              <span>Apple Liquid Glass 2026</span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-deep sm:text-5xl lg:text-6xl">
              Tienda <span className="text-offer">CondiRico</span>
            </h1>

            <p className="mt-3 mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Experiencia fluida de compra. Todos los productos del supermercado
              organizados meticulosamente en secciones según su categoría.
            </p>

            {/* Micro Badges / Value Pillars */}
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-semibold text-foreground/85">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-1.5 backdrop-blur-md shadow-2xs">
                <Truck className="size-3.5 text-emerald-600" /> Envío gratis +$35
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-1.5 backdrop-blur-md shadow-2xs">
                <Check className="size-3.5 text-emerald-600" /> Entrega hoy mismo
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-1.5 backdrop-blur-md shadow-2xs">
                <ShieldCheck className="size-3.5 text-emerald-600" /> Calidad certificada
              </span>
            </div>

            {/* Liquid Glass Search Bar */}
            <div className="mt-8 mx-auto max-w-xl">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar arroz, aceite de oliva, detergente, café..."
                  aria-label="Buscar en la tienda"
                  className="h-13 w-full rounded-full border border-white/80 bg-white/75 pl-12 pr-12 text-sm outline-none backdrop-blur-xl shadow-[0_8px_25px_-5px_rgba(0,0,0,0.05)] transition-all focus:bg-white focus:ring-4 focus:ring-primary/15 focus:border-primary/40"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-muted/80 text-muted-foreground hover:text-foreground active:scale-90"
                    aria-label="Borrar búsqueda"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Sticky Glass Category Dock */}
      <nav
        aria-label="Filtro rápido de secciones"
        className="sticky top-16 z-30 px-4 py-3"
      >
        <div className="mx-auto max-w-5xl rounded-full liquid-glass-dock px-3 py-2 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full sm:w-auto">
            {/* Todas */}
            <button
              type="button"
              onClick={() => setSelectedFilter("todas")}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 active:scale-95 ${
                selectedFilter === "todas"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]"
                  : "bg-white/40 text-muted-foreground hover:bg-white/80 hover:text-foreground"
              }`}
            >
              Todas ({ALL_PRODUCTS.length})
            </button>

            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id];
              const count = ALL_PRODUCTS.filter(
                (p) => p.category === cat.id
              ).length;
              const isSelected = selectedFilter === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(cat.id);
                    scrollToSection(cat.id);
                  }}
                  className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 active:scale-95 border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 scale-[1.02]"
                      : "bg-white/50 text-foreground border-white/80 hover:bg-white/90"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{cat.shortName}</span>
                  <span
                    className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-black/5 text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Cart Pill & WhatsApp on Desktop dock */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {onOpenWhatsAppOrder && (
              <button
                type="button"
                onClick={onOpenWhatsAppOrder}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <WhatsAppIcon className="size-3.5" />
                <span>Pedir por WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/80 px-4 py-1.5 text-xs font-bold shadow-xs transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="size-3.5 text-primary" />
              <span>{cartCount} items</span>
              <span className="text-primary font-black">
                ${cartTotal.toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content: Category Sections in Frosted Glass Layers */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-16">
        {CATEGORIES.map((cat) => {
          if (selectedFilter !== "todas" && selectedFilter !== cat.id) {
            return null;
          }

          const catProducts = filteredProducts.filter(
            (p) => p.category === cat.id
          );
          const Icon = CATEGORY_ICONS[cat.id];

          return (
            <section
              key={cat.id}
              id={`seccion-${cat.id}`}
              ref={sectionRefs[cat.id]}
              className="scroll-mt-32 relative rounded-[36px] liquid-glass p-6 sm:p-9 lg:p-10 shadow-[0_20px_50px_-15px_rgba(20,83,45,0.06)] overflow-hidden"
            >
              {/* Category Specular Edge */}
              <div className="absolute inset-x-12 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

              {/* Category Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-white/60 pb-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`grid size-14 sm:size-16 place-items-center rounded-2xl border shadow-sm shrink-0 transition-transform duration-300 hover:scale-105 ${cat.accent}`}
                  >
                    <Icon className="size-7 sm:size-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${cat.badgeBg}`}
                      >
                        Sección
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">
                        {catProducts.length} productos en stock
                      </span>
                    </div>
                    <h2 className="mt-1 text-2xl sm:text-4xl font-black text-brand-deep tracking-tight">
                      {cat.name}
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <span className="text-xs font-bold text-primary bg-white/70 border border-white/80 px-3 py-1.5 rounded-full shadow-2xs">
                    Frescura y Calidad CondiRico
                  </span>
                </div>
              </div>

              {/* Product Grid: Apple Liquid Glass Cards with Dynamic Sheen */}
              {catProducts.length > 0 ? (
                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6">
                  {catProducts.map((product) => {
                    const inCartQty = cart[product.id] ?? 0;
                    const isFav = favorites.has(product.id);

                    return (
                      <article
                        key={product.id}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-[26px] liquid-glass-card liquid-reflection p-3 sm:p-4"
                      >
                        {/* Image Showcase Pedestal */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white/60 border border-white/80 shadow-inner">
                          {product.pos ? (
                            <div
                              className={`absolute inset-0 bg-cover transition-transform duration-700 ease-out group-hover:scale-108 ${product.pos}`}
                              style={{
                                backgroundImage: `url(${productsSprite})`,
                                backgroundSize: "300% 200%",
                              }}
                            />
                          ) : (
                            <div
                              className={`absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br ${cat.cardBg}`}
                            >
                              <div
                                className={`grid size-16 place-items-center rounded-2xl border ${cat.accent} shadow-2xs mb-2 transition-transform duration-500 group-hover:scale-110`}
                              >
                                <Icon className="size-8" />
                              </div>
                              <span className="text-[11px] font-bold text-muted-foreground">
                                {product.unit}
                              </span>
                            </div>
                          )}

                          {/* Discount Tag */}
                          {product.badge && (
                            <span className="absolute left-2.5 top-2.5 rounded-full bg-offer px-2.5 py-0.5 text-[10px] font-black text-offer-foreground shadow-sm">
                              {product.badge}
                            </span>
                          )}

                          {/* Heart favorite button */}
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(product.id)}
                            className={`absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-white/85 border border-white/90 shadow-sm backdrop-blur-md transition-all duration-300 active:scale-90 hover:scale-110 ${
                              isFav
                                ? "text-destructive"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            aria-label={
                              isFav
                                ? `Quitar ${product.name} de favoritos`
                                : `Agregar ${product.name} a favoritos`
                            }
                          >
                            <Heart
                              className={`size-4 ${isFav ? "fill-current" : ""}`}
                            />
                          </button>
                        </div>

                        {/* Product Meta */}
                        <div className="flex flex-1 flex-col justify-between pt-3.5">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{product.detail}</span>
                              <div className="flex items-center gap-1 font-bold text-amber-500">
                                <Star className="size-3 fill-current" />
                                <span>{product.rating}</span>
                              </div>
                            </div>

                            <h3 className="mt-1.5 text-sm sm:text-base font-extrabold leading-snug text-foreground line-clamp-2 min-h-[2.6rem]">
                              {product.name}
                            </h3>
                          </div>

                          <div className="mt-3.5 pt-3 border-t border-white/60">
                            <div className="flex items-baseline gap-2 mb-2.5">
                              <strong className="text-lg sm:text-xl font-black text-primary">
                                ${product.price.toFixed(2)}
                              </strong>
                              {product.oldPrice && (
                                <span className="text-xs text-muted-foreground line-through">
                                  ${product.oldPrice.toFixed(2)}
                                </span>
                              )}
                            </div>

                            {/* Magnetic Feel Action Button */}
                            {inCartQty > 0 ? (
                              <div className="flex items-center justify-between rounded-full border border-primary/30 bg-primary/10 p-1 backdrop-blur-xs">
                                <button
                                  type="button"
                                  onClick={() => onAddToCart(product.id, -1)}
                                  className="grid size-7 place-items-center rounded-full bg-white text-primary shadow-xs active:scale-90 hover:scale-105 transition-all"
                                  aria-label="Quitar una unidad"
                                >
                                  <Minus className="size-3.5" />
                                </button>
                                <span className="text-xs font-black text-primary px-2">
                                  {inCartQty} en carrito
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onAddToCart(product.id, 1)}
                                  className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs active:scale-90 hover:scale-105 transition-all"
                                  aria-label="Agregar otra unidad"
                                >
                                  <Plus className="size-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddWithFeedback(product)}
                                className="w-full h-9 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-primary/25 liquid-glass-button active:scale-95"
                              >
                                <Plus className="size-3.5" />
                                <span>Agregar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">
                    No se encontraron productos en esta sección para "{searchQuery}".
                  </p>
                </div>
              )}
            </section>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="rounded-[36px] liquid-glass p-14 text-center">
            <Search className="mx-auto size-12 text-muted-foreground/60" />
            <h3 className="mt-4 text-xl font-bold text-foreground">
              No encontramos resultados para "{searchQuery}"
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Prueba con términos como arroz, leche, atún o detergente.
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="mt-6 rounded-full border-white bg-white/70"
            >
              Ver todos los productos
            </Button>
          </div>
        )}
      </main>

      {/* Floating Notification Toast */}
      {addedNotice && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full liquid-glass-dock px-6 py-3 text-xs font-bold text-brand-deep shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 border border-white">
          <div className="grid size-5 place-items-center rounded-full bg-emerald-600 text-white">
            <Check className="size-3" />
          </div>
          <span>{addedNotice}</span>
        </div>
      )}

      {/* Floating "Volver Arriba" Glass Pill */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-30 grid size-12 place-items-center rounded-full liquid-glass-dock text-primary shadow-xl active:scale-90 hover:scale-110 transition-all duration-300 border border-white"
          aria-label="Volver arriba"
        >
          <ArrowUp className="size-5" />
        </button>
      )}
    </div>
  );
};
