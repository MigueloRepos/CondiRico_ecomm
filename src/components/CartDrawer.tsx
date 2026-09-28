import React from "react";
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { ProductItem } from "@/data/products";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Record<number, number>;
  products: ProductItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onProceedToWhatsApp: () => void;
  onExploreStore: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  products,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToWhatsApp,
  onExploreStore,
}) => {
  if (!isOpen) return null;

  const cartEntries = Object.entries(cart).filter(([_, qty]) => qty > 0);
  const cartItems = cartEntries
    .map(([id, qty]) => {
      const prod = products.find((p) => p.id === Number(id));
      return prod ? { product: prod, quantity: qty } : null;
    })
    .filter(Boolean) as { product: ProductItem; quantity: number }[];

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#12352C]/40 backdrop-blur-sm transition-opacity duration-300 flex justify-end"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#E5EAE6] animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5EAE6]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B7A45]">
              Tu Compra
            </span>
            <h2 className="text-2xl font-extrabold text-[#12352C]">
              Carrito ({cartCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-[#E5EAE6] text-[#66736D] hover:text-[#12352C] hover:bg-[#F8F7F2] transition-colors"
            aria-label="Cerrar carrito"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Item List / Empty State */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="grid size-16 place-items-center rounded-full bg-[#F8F7F2] text-[#66736D] mb-4">
                <ShoppingCart className="size-8" />
              </div>
              <h3 className="text-lg font-bold text-[#12352C]">
                Tu carrito está vacío
              </h3>
              <p className="text-xs text-[#66736D] mt-1 max-w-xs">
                Explora nuestro catálogo y agrega los productos de tu preferencia.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExploreStore();
                }}
                className="mt-6 px-6 py-2.5 rounded-full bg-[#075B3A] text-white text-xs font-bold shadow-sm hover:bg-[#0B7A45] transition-all"
              >
                Explorar catálogo
              </button>
            </div>
          ) : (
            cartItems.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-[#E5EAE6] bg-[#F8F7F2]/60 hover:bg-white transition-all"
              >
                {/* Thumbnail */}
                <div className="size-16 rounded-xl bg-white border border-[#E5EAE6] overflow-hidden shrink-0 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ShoppingCart className="size-6 text-[#075B3A]/40" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-[#66736D] font-bold">
                    {product.unit}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#12352C] truncate">
                    {product.name}
                  </h4>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#075B3A]">
                      ${(product.price * quantity).toFixed(2)}
                    </span>
                    <span className="text-[11px] text-[#66736D]">
                      (${product.price.toFixed(2)} c/u)
                    </span>
                  </div>
                </div>

                {/* Quantity Stepper & Remove */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(product.id)}
                    className="text-[#66736D] hover:text-rose-600 transition-colors p-1"
                    aria-label={`Eliminar ${product.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>

                  <div className="flex items-center rounded-full border border-[#E5EAE6] bg-white p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(product.id, -1)}
                      className="grid size-7.5 place-items-center rounded-full text-[#12352C] hover:bg-[#F8F7F2] active:scale-90 transition-transform"
                      aria-label="Restar uno"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-[#12352C]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(product.id, 1)}
                      className="grid size-7.5 place-items-center rounded-full text-[#12352C] hover:bg-[#F8F7F2] active:scale-90 transition-transform"
                      aria-label="Sumar uno"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Summary Action */}
        {cartItems.length > 0 && (
          <div className="p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-[#E5EAE6] bg-[#F8F7F2] space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#66736D]">Subtotal estimado:</span>
              <span className="text-xl font-extrabold text-[#12352C]">
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            <p className="text-[11px] text-[#66736D] leading-tight">
              Envío y confirmación coordinados directamente por WhatsApp con nuestro equipo.
            </p>

            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedToWhatsApp();
              }}
              className="w-full h-12 rounded-full bg-[#075B3A] hover:bg-[#0B7A45] text-white text-xs font-bold flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <WhatsAppIcon className="size-4" />
              <span>Tramitar pedido por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onExploreStore();
              }}
              className="w-full py-1.5 text-center text-xs font-semibold text-[#075B3A] hover:underline cursor-pointer"
            >
              Continuar viendo productos
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
