import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductItem } from "@/data/products";
import {
  getCart as getDbCart,
  updateCartItem as updateDbCart,
  removeFromCart as removeDbCart,
  clearCart as clearDbCart,
} from "@/services/cart";

export function useCart(userId?: string | null, productsList: ProductItem[] = []) {
  const [cart, setCart] = useState<Record<number, number>>(() => {
    try {
      const stored = localStorage.getItem("condirico_cart_v1");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Load user cart from Supabase when user logs in
  useEffect(() => {
    if (!userId) return;

    getDbCart(userId)
      .then((dbCart) => {
        if (dbCart && Object.keys(dbCart).length > 0) {
          setCart(dbCart);
          try {
            localStorage.setItem("condirico_cart_v1", JSON.stringify(dbCart));
          } catch {
            // Ignore
          }
        }
      })
      .catch(console.warn);
  }, [userId]);

  // Persist guest cart locally
  useEffect(() => {
    try {
      localStorage.setItem("condirico_cart_v1", JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart]);

  const changeCart = useCallback(
    (productId: number, amount: number) => {
      setCart((current) => {
        const currentQty = current[productId] ?? 0;
        const nextQty = Math.max(0, currentQty + amount);
        const updated = { ...current, [productId]: nextQty };

        if (nextQty <= 0) {
          delete updated[productId];
        }

        // Sync with Supabase if authenticated
        if (userId) {
          if (nextQty > 0) {
            updateDbCart(userId, productId, nextQty).catch(console.warn);
          } else {
            removeDbCart(userId, productId).catch(console.warn);
          }
        }

        return updated;
      });
    },
    [userId]
  );

  const clearCart = useCallback(() => {
    setCart({});
    try {
      localStorage.removeItem("condirico_cart_v1");
    } catch {
      // Ignore
    }
    if (userId) {
      clearDbCart(userId).catch(console.warn);
    }
  }, [userId]);

  const cartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return productsList.reduce((sum, p) => {
      const qty = cart[p.id] || 0;
      return sum + p.price * qty;
    }, 0);
  }, [cart, productsList]);

  const shippingCost = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    return cartSubtotal >= 35 ? 0 : 3.5;
  }, [cartSubtotal]);

  const cartTotal = useMemo(() => {
    return cartSubtotal + shippingCost;
  }, [cartSubtotal, shippingCost]);

  return {
    cart,
    setCart,
    changeCart,
    clearCart,
    cartCount,
    cartSubtotal,
    shippingCost,
    cartTotal,
  };
}
