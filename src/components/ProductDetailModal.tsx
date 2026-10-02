import React, { useState } from "react";
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  Heart,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ShoppingBag,
  Star,
  MessageSquare,
  Package,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { ProductItem } from "@/data/products";
import { UserProfile } from "@/lib/auth";
import { ProductReviews } from "@/components/ProductReviews";

interface ProductDetailModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (id: number, quantity: number) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onOpenWhatsApp: (productName?: string) => void;
  currentUser?: UserProfile | null;
  onRequireLogin?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
  onOpenWhatsApp,
  currentUser = null,
  onRequireLogin = () => {},
}) => {
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<"detail" | "reviews">("detail");
  const [liveReviewsCount, setLiveReviewsCount] = useState<number | null>(null);
  const [liveRating, setLiveRating] = useState<number | null>(null);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    onAddToCart(product.id, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const stockQty = product.stockQuantity ?? product.stock ?? 10;
  const isOutOfStock = stockQty <= 0;
  const isLowStock = stockQty > 0 && stockQty <= 5;

  const displayRating = liveRating !== null ? liveRating : product.rating;
  const displayReviewsCount = liveReviewsCount !== null ? liveReviewsCount : product.reviews;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#12352C]/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Tab Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-8 py-3.5 bg-slate-50/70">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("detail")}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "detail"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Package className="size-3.5" />
              <span>Detalles del Producto</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "reviews"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <MessageSquare className="size-3.5" />
              <span>Reseñas ({displayReviewsCount})</span>
              <span className="inline-flex items-center gap-0.5 text-amber-500 ml-0.5">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span>{displayRating.toFixed(1)}</span>
              </span>
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 shadow-xs transition-colors cursor-pointer"
            aria-label="Cerrar detalle"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-8">
          {activeTab === "detail" ? (
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
              {/* Left Column: Product Image Pedestal */}
              <div className="w-full md:w-1/2 p-6 sm:p-8 bg-[#F8F7F2] rounded-3xl border border-[#E5EAE6] flex flex-col justify-between items-center relative">
                {/* Category & Favorite Header */}
                <div className="w-full flex items-center justify-between text-xs text-[#66736D] mb-4">
                  <span className="uppercase tracking-wider font-bold text-primary">
                    {product.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(product.id)}
                    className="grid size-9 place-items-center rounded-full bg-white border border-[#E5EAE6] text-[#66736D] hover:text-[#12352C] shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    aria-label="Favorito"
                  >
                    <Heart
                      className={`size-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
                    />
                  </button>
                </div>

                {/* Product Image */}
                <div className="relative aspect-square w-full max-w-[280px] rounded-2xl bg-white border border-[#E5EAE6] overflow-hidden shadow-xs flex items-center justify-center my-auto group">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <ShoppingBag className="size-20 text-[#075B3A]/40" />
                  )}
                </div>

                {/* Stock indicator */}
                <div className="w-full mt-5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`size-2 rounded-full ${
                        isOutOfStock
                          ? "bg-rose-500"
                          : isLowStock
                          ? "bg-amber-500 animate-pulse"
                          : "bg-emerald-600 animate-pulse"
                      }`}
                    />
                    <span
                      className={`font-bold ${
                        isOutOfStock
                          ? "text-rose-600"
                          : isLowStock
                          ? "text-amber-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {isOutOfStock
                        ? "Agotado"
                        : isLowStock
                        ? `Pocas unidades (${stockQty})`
                        : "En stock"}
                    </span>
                  </div>
                  <span className="text-[#66736D] font-mono text-[11px]">
                    Código #{product.id}
                  </span>
                </div>
              </div>

              {/* Right Column: Product Meta & Add to Cart */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-black">
                      {product.unit} · CondiRico Selección
                    </span>

                    {/* Interactive Clickable Rating Pill */}
                    <button
                      type="button"
                      onClick={() => setActiveTab("reviews")}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 text-xs font-bold transition-all cursor-pointer group"
                    >
                      <Star className="size-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>{displayRating.toFixed(1)}</span>
                      <span className="text-amber-700 underline text-[11px]">
                        ({displayReviewsCount} {displayReviewsCount === 1 ? "reseña" : "reseñas"})
                      </span>
                    </button>
                  </div>

                  <h3 className="mt-2 text-2xl sm:text-3xl font-black text-brand-deep leading-tight">
                    {product.name}
                  </h3>

                  {/* Price Row */}
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-brand-deep">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.oldPrice && (
                      <span className="text-sm text-muted-foreground line-through font-medium">
                        ${product.oldPrice.toFixed(2)}
                      </span>
                    )}
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Precio IVA Incluido
                    </span>
                  </div>

                  {/* Detail / Description */}
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                      {product.detail ||
                        "Producto de primera calidad garantizado por CondiRico. Empaque sellado de fábrica para mantener la frescura e higiene integral."}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="mt-6 flex items-center gap-4">
                    <span className="text-xs font-black text-brand-deep uppercase tracking-wider">
                      Cantidad:
                    </span>
                    <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="grid size-8 place-items-center rounded-full bg-white text-brand-deep shadow-2xs hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        disabled={quantity <= 1}
                        aria-label="Restar uno"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-10 text-center font-black text-sm text-brand-deep">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="grid size-8 place-items-center rounded-full bg-white text-brand-deep shadow-2xs hover:bg-slate-100 cursor-pointer"
                        aria-label="Sumar uno"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`w-full h-12 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      addedFeedback
                        ? "bg-emerald-700 text-white"
                        : isOutOfStock
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 active:scale-98"
                    }`}
                  >
                    {addedFeedback ? (
                      <>
                        <CheckCircle2 className="size-4" />
                        <span>¡Agregado al carrito!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="size-4" />
                        <span>
                          Agregar al carrito • ${(product.price * quantity).toFixed(2)} USD
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp(product.name)}
                    className="w-full h-11 rounded-full border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-brand-deep flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <WhatsAppIcon className="size-4" />
                    <span>Consultar o pedir por WhatsApp</span>
                  </button>

                  {/* Trust markers */}
                  <div className="pt-2 flex items-center justify-around text-[11px] text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1 text-emerald-800">
                      <Truck className="size-3.5 text-primary" /> Entrega en 24h
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-emerald-800">
                      <ShieldCheck className="size-3.5 text-primary" /> Garantía de Calidad
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: REVIEWS COMPONENT */
            <ProductReviews
              productId={product.id}
              productName={product.name}
              currentUser={currentUser}
              onRequireLogin={onRequireLogin}
              onReviewsCountChange={(newCount, newAvg) => {
                setLiveReviewsCount(newCount);
                setLiveRating(newAvg);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
