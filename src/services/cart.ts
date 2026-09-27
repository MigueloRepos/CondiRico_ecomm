import { supabase } from "@/lib/supabase";
import { CartItem } from "@/types/database";

/**
 * Loads the user's cart from public.cart_items
 */
export async function getCart(userId: string): Promise<Record<number, number>> {
  if (!userId) return {};

  try {
    const { data, error } = await supabase
      .from("cart_items")
      .select("product_id, quantity")
      .eq("user_id", userId);

    if (error) {
      console.error("[getCart] Supabase error:", error);
      return {};
    }

    const cartMap: Record<number, number> = {};
    (data || []).forEach((item: { product_id: number; quantity: number }) => {
      if (item.product_id && item.quantity > 0) {
        cartMap[item.product_id] = item.quantity;
      }
    });

    return cartMap;
  } catch (err) {
    console.error("[getCart] Unexpected error:", err);
    return {};
  }
}

/**
 * Adds or increments a product quantity in the database cart
 */
export async function addToCart(
  userId: string,
  productId: number,
  quantityToAdd: number = 1
): Promise<boolean> {
  if (!userId || !productId || quantityToAdd <= 0) return false;

  try {
    // Check existing item
    const { data: existing, error: fetchErr } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();

    if (fetchErr) {
      console.error("[addToCart] Error checking existing cart item:", fetchErr);
    }

    if (existing) {
      const newQty = (existing.quantity || 0) + quantityToAdd;
      const { error: updateErr } = await supabase
        .from("cart_items")
        .update({
          quantity: newQty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabase.from("cart_items").insert({
        user_id: userId,
        product_id: productId,
        quantity: quantityToAdd,
      });

      if (insertErr) throw insertErr;
    }

    return true;
  } catch (err) {
    console.error("[addToCart] Failed to add item to Supabase cart:", err);
    return false;
  }
}

/**
 * Updates a product's exact quantity in the database cart.
 * If quantity <= 0, deletes the item.
 */
export async function updateCartItem(
  userId: string,
  productId: number,
  quantity: number
): Promise<boolean> {
  if (!userId || !productId) return false;

  try {
    if (quantity <= 0) {
      return await removeFromCart(userId, productId);
    }

    const { data: existing } = await supabase
      .from("cart_items")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("cart_items")
        .update({
          quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("cart_items").insert({
        user_id: userId,
        product_id: productId,
        quantity,
      });

      if (error) throw error;
    }

    return true;
  } catch (err) {
    console.error("[updateCartItem] Failed to update cart item:", err);
    return false;
  }
}

/**
 * Removes an item from the database cart
 */
export async function removeFromCart(
  userId: string,
  productId: number
): Promise<boolean> {
  if (!userId || !productId) return false;

  try {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) {
      console.error("[removeFromCart] Error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[removeFromCart] Failed to remove item:", err);
    return false;
  }
}

/**
 * Clears all items in the user's cart
 */
export async function clearCart(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("[clearCart] Error clearing cart:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[clearCart] Failed to clear cart:", err);
    return false;
  }
}

/**
 * Synchronizes local unauthenticated cart with the user's Supabase cart upon sign in
 */
export async function syncLocalCartToSupabase(
  userId: string,
  localCart: Record<number, number> = {}
): Promise<Record<number, number>> {
  if (!userId) return localCart;

  try {
    const dbCart = await getCart(userId);
    const mergedCart: Record<number, number> = { ...dbCart };

    for (const [productIdStr, localQty] of Object.entries(localCart)) {
      const pId = Number(productIdStr);
      if (localQty > 0) {
        if (!mergedCart[pId]) {
          mergedCart[pId] = localQty;
          await updateCartItem(userId, pId, localQty);
        }
      }
    }

    return mergedCart;
  } catch (err) {
    console.error("[syncLocalCartToSupabase] Error syncing cart:", err);
    return localCart;
  }
}
