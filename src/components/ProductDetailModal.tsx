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
  Share2,
  ShoppingBag,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { ProductItem } from "@/data/products";

interface ProductDetailModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (id: number, quantity: number) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onOpenWhatsApp: (productName?: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
  onOpenWhatsApp,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    onAddToCart(product.id, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const stockQty = product.stockQuantity ?? product.stock ?? 10;
  const isOutOfStock = stockQty <= 0;
  const isLowStock = stockQty > 0 && stockQty <= 5;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#12352C]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#E5EAE6] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 grid size-9 place-items-center rounded-full bg-white/90 border border-[#E5EAE6] text-[#66736D] hover:text-[#12352C] hover:bg-white shadow-xs"
          aria-label="Cerrar detalle"
        >
          <X className="size-4" />
        </button>

        {/* Left: Product Image Pedestal */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 bg-[#F8F7F2] flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-[#E5EAE6]">
          {/* Category kicker */}
          <div className="w-full flex items-center justify-between text-xs text-[#66736D] mb-4">
            <span className="uppercase tracking-wider font-semibold">
              {product.category}
            </span>
            <button
              type="button"
              onClick={() => onToggleFavorite(product.id)}
              className="grid size-8 place-items-center rounded-full bg-white border border-[#E5EAE6] text-[#66736D] hover:text-[#12352C] transition-colors"
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

          {/* Stock state indicator */}
          <div className="w-full mt-4 flex items-center justify-between text-xs">
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
                className={`font-semibold ${
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
              ID #{product.id}
            </span>
          </div>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#66736D] font-semibold">
              {product.unit} · CondiRico Selección
            </span>

            <h3 className="mt-1 text-2xl sm:text-3xl font-bold text-[#12352C] leading-tight">
              {product.name}
            </h3>

            {/* Price Row */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[#12352C]">
                ${product.price.toFixed(2)}
              </span>
              {product.oldPrice && (
                <span className="text-sm text-[#66736D] line-through font-medium">
                  ${product.oldPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Detail / Description */}
            <div className="mt-5 pt-5 border-t border-[#E5EAE6]">
              <p className="text-sm text-[#66736D] leading-relaxed">
                {product.detail ||
                  "Producto de primera calidad garantizado por CondiRico. Empaque sellado de fábrica para mantener la frescura e higiene integral."}
              </p>
            </div>

            {/* Quantity Stepper */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-xs font-bold text-[#12352C] uppercase tracking-wider">
                Cantidad:
              </span>
              <div className="flex items-center rounded-full border border-[#E5EAE6] bg-[#F8F7F2] p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid size-8 place-items-center rounded-full bg-white text-[#12352C] shadow-2xs hover:bg-neutral-100 disabled:opacity-40"
                  disabled={quantity <= 1}
                  aria-label="Restar uno"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-[#12352C]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="grid size-8 place-items-center rounded-full bg-white text-[#12352C] shadow-2xs hover:bg-neutral-100"
                  aria-label="Sumar uno"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 pt-6 border-t border-[#E5EAE6] space-y-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full h-12 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                addedFeedback
                  ? "bg-emerald-700 text-white"
                  : isOutOfStock
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  : "bg-[#075B3A] hover:bg-[#0B7A45] text-white shadow-md active:scale-98"
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
                    Agregar al carrito • ${(product.price * quantity).toFixed(2)}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onOpenWhatsApp(product.name)}
              className="w-full h-11 rounded-full border border-[#E5EAE6] bg-white hover:bg-[#F8F7F2] font-semibold text-xs text-[#12352C] flex items-center justify-center gap-2 transition-all"
            >
              <WhatsAppIcon className="size-4" />
              <span>Consultar o pedir por WhatsApp</span>
            </button>

            {/* Mini Trust markers */}
            <div className="pt-2 flex items-center justify-around text-[11px] text-[#66736D]">
              <span className="flex items-center gap-1">
                <Truck className="size-3 text-[#075B3A]" /> Entrega en 24h
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3 text-[#075B3A]" /> Calidad CondiRico
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
