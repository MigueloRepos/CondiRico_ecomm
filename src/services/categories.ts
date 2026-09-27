import { supabase } from "@/lib/supabase";
import { Category, CategoryId } from "@/types/database";
import { CategoryInfo } from "@/data/products";

// Visual metadata configuration map per category id to preserve exact UX styling
const CATEGORY_STYLES: Record<string, {
  accent: string;
  badgeBg: string;
  borderHover: string;
  cardBg: string;
}> = {
  alimentos: {
    accent: "text-emerald-700 bg-emerald-100/90 border-emerald-200",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    borderHover: "hover:border-emerald-400 hover:shadow-emerald-500/10",
    cardBg: "from-emerald-50/60 via-background to-background",
  },
  "primera-necesidad": {
    accent: "text-amber-700 bg-amber-100/90 border-amber-200",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    borderHover: "hover:border-amber-400 hover:shadow-amber-500/10",
    cardBg: "from-amber-50/60 via-background to-background",
  },
  limpieza: {
    accent: "text-teal-700 bg-teal-100/90 border-teal-200",
    badgeBg: "bg-teal-50 text-teal-800 border-teal-200",
    borderHover: "hover:border-teal-400 hover:shadow-teal-500/10",
    cardBg: "from-teal-50/60 via-background to-background",
  },
  utiles: {
    accent: "text-orange-700 bg-orange-100/90 border-orange-200",
    badgeBg: "bg-orange-50 text-orange-800 border-orange-200",
    borderHover: "hover:border-orange-400 hover:shadow-orange-500/10",
    cardBg: "from-orange-50/60 via-background to-background",
  },
};

const DEFAULT_STYLE = {
  accent: "text-emerald-700 bg-emerald-100/90 border-emerald-200",
  badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
  borderHover: "hover:border-emerald-400 hover:shadow-emerald-500/10",
  cardBg: "from-emerald-50/60 via-background to-background",
};

/**
 * Maps a database category row into the frontend CategoryInfo interface
 */
export function mapCategoryFromDatabase(
  dbCategory: Category,
  productCount?: number
): CategoryInfo {
  const styles = CATEGORY_STYLES[dbCategory.id] || DEFAULT_STYLE;
  return {
    id: dbCategory.id as CategoryId,
    name: dbCategory.name,
    shortName: dbCategory.short_name || dbCategory.name,
    description: dbCategory.description || "",
    count: productCount !== undefined ? `${productCount} productos` : "Disponible",
    accent: styles.accent,
    badgeBg: styles.badgeBg,
    borderHover: styles.borderHover,
    cardBg: styles.cardBg,
  };
}

/**
 * Fetches all active categories from Supabase ordered by sort_order
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[getCategories] Supabase error:", error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error("[getCategories] Unexpected error:", err);
    return [];
  }
}

/**
 * Fetches a single category by its ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("[getCategoryById] Supabase error:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[getCategoryById] Unexpected error:", err);
    return null;
  }
}
