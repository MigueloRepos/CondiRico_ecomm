import { supabase } from "@/lib/supabase";
import { ProductReview, ProductReviewStats } from "@/types/database";

/**
 * Default sample reviews to display gracefully when a product doesn't have database reviews yet.
 */
const INITIAL_DEMO_REVIEWS: Record<number, ProductReview[]> = {
  1: [
    {
      id: "demo-rev-1",
      product_id: 1,
      user_id: "demo-user-1",
      user_name: "Camila Soto",
      user_email: "camila@example.com",
      rating: 5,
      comment: "Excelente calidad, grano entero y aroma perfecto. Siempre lo compro para el almuerzo familiar.",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "demo-rev-2",
      product_id: 1,
      user_id: "demo-user-2",
      user_name: "Ignacio Valdés",
      user_email: "ignacio@example.com",
      rating: 5,
      comment: "Rinde bastante y queda en su punto. El despacho de CondiRico llegó en menos de 24 horas.",
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ],
  2: [
    {
      id: "demo-rev-3",
      product_id: 2,
      user_id: "demo-user-3",
      user_name: "Valentina Rojas",
      user_email: "vale@example.com",
      rating: 5,
      comment: "Aceite muy limpio, sabor suave y rinde mucho en frituras y ensaladas.",
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
};

/**
 * Fetch all reviews for a specific product from Supabase.
 */
export async function getProductReviews(productId: number): Promise<ProductReview[]> {
  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist yet or permissions issue, provide fallback demo reviews if available
      console.warn(`[reviews] Note fetching product ${productId} reviews from Supabase:`, error.message);
      return INITIAL_DEMO_REVIEWS[productId] || [];
    }

    if (data && data.length > 0) {
      return data as ProductReview[];
    }

    return INITIAL_DEMO_REVIEWS[productId] || [];
  } catch (err) {
    console.warn(`[reviews] Unexpected error fetching reviews for product ${productId}:`, err);
    return INITIAL_DEMO_REVIEWS[productId] || [];
  }
}

/**
 * Calculate review statistics (average, total, distribution 1-5).
 */
export function calculateReviewStats(reviews: ProductReview[]): ProductReviewStats {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      ratingDistribution: distribution,
    };
  }

  let sum = 0;
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star] = (distribution[star] || 0) + 1;
    sum += r.rating;
  });

  const average = Number((sum / reviews.length).toFixed(1));

  return {
    averageRating: average,
    totalReviews: reviews.length,
    ratingDistribution: distribution,
  };
}

/**
 * Fetch review stats for a product.
 */
export async function getProductReviewStats(productId: number): Promise<ProductReviewStats> {
  const reviews = await getProductReviews(productId);
  return calculateReviewStats(reviews);
}

/**
 * Get current user's existing review for this product if any.
 */
export async function getUserProductReview(
  productId: number,
  userId: string
): Promise<ProductReview | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as ProductReview;
  } catch {
    return null;
  }
}

/**
 * Create or update a review in Supabase.
 * Enforces authenticated user check.
 */
export async function submitProductReview(params: {
  productId: number;
  rating: number;
  comment: string;
  userName: string;
  userEmail?: string;
}): Promise<{ success: boolean; review?: ProductReview; error?: string }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión con tu cuenta para dejar una calificación y comentario.",
      };
    }

    if (params.rating < 1 || params.rating > 5) {
      return {
        success: false,
        error: "La calificación debe ser entre 1 y 5 estrellas.",
      };
    }

    const cleanComment = params.comment.trim();
    if (cleanComment.length < 3) {
      return {
        success: false,
        error: "Por favor escribe un comentario de al menos 3 caracteres.",
      };
    }

    const payload = {
      product_id: params.productId,
      user_id: user.id,
      user_name: params.userName.trim() || user.user_metadata?.full_name || "Cliente CondiRico",
      user_email: params.userEmail || user.email || null,
      rating: Math.round(params.rating),
      comment: cleanComment,
      updated_at: new Date().toISOString(),
    };

    // Upsert on conflict (product_id, user_id)
    const { data, error } = await supabase
      .from("product_reviews")
      .upsert(payload, { onConflict: "product_id,user_id" })
      .select()
      .single();

    if (error) {
      console.error("[reviews] Error submitting review:", error);
      return {
        success: false,
        error: error.message || "No se pudo registrar la reseña en la base de datos.",
      };
    }

    return {
      success: true,
      review: data as ProductReview,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado al guardar la reseña.";
    console.error("[reviews] Unexpected error:", err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Delete a user review by ID.
 */
export async function deleteProductReview(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al eliminar la reseña.",
    };
  }
}
