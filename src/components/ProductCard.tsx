import React, { useState } from "react";
import { Plus, Check, Heart, ShoppingBag, Eye } from "lucide-react";
import { ProductItem } from "@/data/products";

interface ProductCardProps {
  product: ProductItem;
  inCartCount: number;
  isFavorite: boolean;
  onAddToCart: (id: number, quantity: number) => void;
  onToggleFavorite: (id: number) => void;
  onQuickView: (product: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  inCartCount,
  isFavorite,
  onAddToCart,
  onToggleFavorite,
  onQuickView,
}) => {
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product.id, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const stockQty = product.stockQuantity ?? product.stock ?? 10;
  const isOutOfStock = stockQty <= 0;
  const isLowStock = stockQty > 0 && stockQty <= 5;

  return (
    <article
      onClick={() => onQuickView(product)}
      className="group relative flex flex-col justify-between rounded-3xl bg-white border border-[#E5EAE6] p-4 sm:p-5 shadow-xs hover:shadow-xl hover:border-[#CBD5CE] transition-all duration-300 cursor-pointer"
    >
      {/* Top Media Showcase */}
      <div className="relative aspect-square w-full rounded-2xl bg-[#F8F7F2] border border-[#E5EAE6] overflow-hidden flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <ShoppingBag className="size-16 text-[#075B3A]/30 transition-transform duration-500 group-hover:scale-110" />
        )}

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-white/90 backdrop-blur-md border border-[#E5EAE6] text-[#66736D] hover:text-rose-500 hover:bg-white shadow-2xs transition-all active:scale-90"
          aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart
            className={`size-4 transition-colors ${
              isFavorite ? "fill-rose-500 text-rose-500" : ""
            }`}
          />
        </button>

        {/* Real Badge if exists */}
        {product.badge && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-[#12352C] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
            {product.badge}
          </span>
        )}

        {/* Quick View Hover Indicator on Desktop */}
        <div className="absolute inset-0 bg-[#12352C]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none hidden sm:flex">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-xs font-bold text-[#12352C] shadow-md backdrop-blur-md">
            <Eye className="size-3.5 text-[#075B3A]" />
            <span>Vista rápida</span>
          </span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="pt-4 flex flex-1 flex-col justify-between">
        <div>
          {/* Metadata Row: Category & Stock State */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#66736D]">
            <span className="uppercase tracking-wider font-semibold text-[11px] truncate">
              {product.unit}
            </span>

            {/* Subtle Unboxed Stock Indicator */}
            <span className="flex items-center gap-1 text-[11px] font-medium shrink-0">
              <span
                className={`size-1.5 rounded-full ${
                  isOutOfStock
                    ? "bg-rose-500"
                    : isLowStock
                    ? "bg-amber-500 animate-pulse"
                    : "bg-emerald-600"
                }`}
              />
              <span
                className={
                  isOutOfStock
                    ? "text-rose-600"
                    : isLowStock
                    ? "text-amber-700"
                    : "text-emerald-700"
                }
              >
                {isOutOfStock
                  ? "Agotado"
                  : isLowStock
                  ? `Pocas unid.`
                  : "En stock"}
              </span>
            </span>
          </div>

          {/* Product Name */}
          <h3 className="mt-1 text-sm sm:text-base font-bold text-[#12352C] line-clamp-2 min-h-[2.5rem] group-hover:text-[#075B3A] transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Short Detail Note */}
          <p className="mt-1 text-xs text-[#66736D] line-clamp-1">
            {product.detail}
          </p>
        </div>

        {/* Pricing and Action Row */}
        <div className="mt-4 pt-3 border-t border-[#E5EAE6] flex items-center justify-between gap-2">
          <div>
            <span className="text-base sm:text-lg font-extrabold text-[#12352C]">
              ${product.price.toFixed(2)}
            </span>
            {product.oldPrice && (
              <span className="block text-xs text-[#66736D] line-through font-medium">
                ${product.oldPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`h-9 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
              justAdded
                ? "bg-emerald-700 text-white"
                : inCartCount > 0
                ? "bg-[#075B3A] text-white hover:bg-[#0B7A45]"
                : "bg-[#F8F7F2] text-[#12352C] border border-[#E5EAE6] hover:bg-[#075B3A] hover:text-white hover:border-transparent"
            }`}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            {justAdded ? (
              <>
                <Check className="size-3.5" />
                <span>Listo</span>
              </>
            ) : inCartCount > 0 ? (
              <>
                <Check className="size-3.5" />
                <span>En carrito ({inCartCount})</span>
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
