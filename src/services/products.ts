import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import { ProductItem, CategoryId } from "@/data/products";

// Visual sprite positions mapping for sprite-based cards
const SPRITE_POSITIONS: Record<number, string> = {
  1: "bg-[position:0%_0%]",
  2: "bg-[position:50%_0%]",
  3: "bg-[position:100%_0%]",
  4: "bg-[position:0%_100%]",
  5: "bg-[position:50%_100%]",
  6: "bg-[position:100%_100%]",
};

/**
 * Maps a database Product record to the frontend ProductItem interface
 */
export function mapProductFromDatabase(dbProduct: Product): ProductItem {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    detail: dbProduct.detail || "",
    price: Number(dbProduct.price),
    oldPrice: dbProduct.old_price ? Number(dbProduct.old_price) : undefined,
    category: dbProduct.category_id as CategoryId,
    badge: dbProduct.badge || undefined,
    pos: SPRITE_POSITIONS[dbProduct.id] || undefined,
    unit: dbProduct.unit || "unidad",
    rating: Number(dbProduct.rating || 5.0),
    reviews: Number(dbProduct.reviews || 0),
    isPopular: Boolean(dbProduct.is_popular),
    isFeatured: Boolean(dbProduct.is_featured),
    imageUrl: dbProduct.image_url || undefined,
    stockQuantity: dbProduct.stock_quantity !== undefined && dbProduct.stock_quantity !== null
      ? Number(dbProduct.stock_quantity)
      : (dbProduct.stock !== undefined ? Number(dbProduct.stock) : 12),
    stock: dbProduct.stock !== undefined ? Number(dbProduct.stock) : 12,
  };
}

/**
 * Fetches all active products from Supabase with their category relation
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          short_name
        )
      `)
      .eq("is_active", true)
      .order("id", { ascending: true });

    if (error) {
      console.error("[getProducts] Supabase error:", error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error("[getProducts] Unexpected error:", err);
    return [];
  }
}

/**
 * Fetches all active products as frontend-compatible ProductItem objects
 */
export async function getProductItems(): Promise<ProductItem[]> {
  const products = await getProducts();
  return products.map(mapProductFromDatabase);
}

/**
 * Fetches featured products from Supabase (is_featured = true)
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          short_name
        )
      `)
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("id", { ascending: true });

    if (error) {
      console.error("[getFeaturedProducts] Supabase error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[getFeaturedProducts] Unexpected error:", err);
    return [];
  }
}

/**
 * Fetches popular products from Supabase (is_popular = true)
 */
export async function getPopularProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          short_name
        )
      `)
      .eq("is_active", true)
      .eq("is_popular", true)
      .order("id", { ascending: true });

    if (error) {
      console.error("[getPopularProducts] Supabase error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[getPopularProducts] Unexpected error:", err);
    return [];
  }
}

/**
 * Fetches products filtered by category_id
 */
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          short_name
        )
      `)
      .eq("is_active", true)
      .eq("category_id", categoryId)
      .order("id", { ascending: true });

    if (error) {
      console.error("[getProductsByCategory] Supabase error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[getProductsByCategory] Unexpected error:", err);
    return [];
  }
}

/**
 * Fetches a product by its slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          short_name
        )
      `)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("[getProductBySlug] Supabase error:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[getProductBySlug] Unexpected error:", err);
    return null;
  }
}

/**
 * Fetches a product by its ID
 */
export async function getProductById(id: number): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          short_name
        )
      `)
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("[getProductById] Supabase error:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[getProductById] Unexpected error:", err);
    return null;
  }
}
