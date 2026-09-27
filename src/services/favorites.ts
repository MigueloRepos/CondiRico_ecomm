import { supabase } from "@/lib/supabase";

/**
 * Loads the user's favorite product IDs from public.favorites
 */
export async function getFavorites(userId: string): Promise<number[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("product_id")
      .eq("user_id", userId);

    if (error) {
      console.error("[getFavorites] Supabase error:", error);
      return [];
    }

    return (data || []).map((f: { product_id: number }) => f.product_id);
  } catch (err) {
    console.error("[getFavorites] Unexpected error:", err);
    return [];
  }
}

/**
 * Adds a product to the user's favorites in Supabase
 */
export async function addFavorite(userId: string, productId: number): Promise<boolean> {
  if (!userId || !productId) return false;

  try {
    const { error } = await supabase
      .from("favorites")
      .insert({
        user_id: userId,
        product_id: productId,
      });

    if (error && error.code !== "23505") { // Ignore unique violation if already favorited
      console.error("[addFavorite] Supabase error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[addFavorite] Unexpected error:", err);
    return false;
  }
}

/**
 * Removes a product from the user's favorites in Supabase
 */
export async function removeFavorite(userId: string, productId: number): Promise<boolean> {
  if (!userId || !productId) return false;

  try {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) {
      console.error("[removeFavorite] Supabase error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[removeFavorite] Unexpected error:", err);
    return false;
  }
}

/**
 * Checks if a specific product is favorited by the user
 */
export async function isFavorite(userId: string, productId: number): Promise<boolean> {
  if (!userId || !productId) return false;

  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("product_id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      console.error("[isFavorite] Supabase error:", error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error("[isFavorite] Unexpected error:", err);
    return false;
  }
}
