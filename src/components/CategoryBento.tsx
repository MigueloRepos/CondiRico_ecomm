import React, { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  ShoppingBasket,
  Sparkles,
  Home as HomeIcon,
  Apple,
  Milk,
  Coffee,
  Wine,
  Beef,
  Fish,
  Croissant,
  Baby,
  Dog,
  Wheat,
  Soup,
  Package,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types/database";
import { CategoryId } from "@/data/products";

interface CategoryWithCount extends Category {
  productCount?: number;
}

interface CategoryBentoProps {
  onSelectCategory: (categoryId: CategoryId) => void;
  onExploreAll: () => void;
}

/**
 * Standard category to Lucide icon dictionary
 */
export const categoryIconMap: Record<string, React.ElementType> = {
  alimentos: UtensilsCrossed,
  "alimentos sellados": UtensilsCrossed,
  "alimentos-sellados": UtensilsCrossed,
  "primera-necesidad": ShoppingBasket,
  "primera necesidad": ShoppingBasket,
  "productos de primera necesidad": ShoppingBasket,
  "productos-de-primera-necesidad": ShoppingBasket,
  limpieza: Sparkles,
  "limpieza del hogar": Sparkles,
  "limpieza-del-hogar": Sparkles,
  utiles: HomeIcon,
  "útiles": HomeIcon,
  "utiles del hogar": HomeIcon,
  "útiles del hogar": HomeIcon,
  "utiles-del-hogar": HomeIcon,
  panaderia: Croissant,
  "panadería": Croissant,
  reposteria: Croissant,
  "repostería": Croissant,
  frutas: Apple,
  verduras: Apple,
  frescos: Apple,
  lacteos: Milk,
  "lácteos": Milk,
  leche: Milk,
  quesos: Milk,
  carnes: Beef,
  pollo: Beef,
  pescados: Fish,
  mariscos: Fish,
  bebidas: Coffee,
  cafes: Coffee,
  "cafés": Coffee,
  vinos: Wine,
  licores: Wine,
  bebes: Baby,
  "bebés": Baby,
  infantil: Baby,
  mascotas: Dog,
  cereales: Wheat,
  pastas: Wheat,
  harinas: Wheat,
  sopas: Soup,
  caldos: Soup,
};

// Generic default Lucide icon fallback when category is unknown or not present in categoryIconMap
export const DEFAULT_CATEGORY_ICON: React.ElementType = LayoutGrid;
export const FALLBACK_CATEGORY_ICON: React.ElementType = Package;

/**
 * Robust dynamic Lucide vectorial icon mapper for any Supabase category.
 * If the category name or ID does not match any key in categoryIconMap,
 * it returns a generic Lucide icon (LayoutGrid / Package) instead of breaking the render.
 */
export function getDynamicCategoryIcon(name?: string | null, id?: string | null): React.ElementType {
  if (!name && !id) {
    return DEFAULT_CATEGORY_ICON;
  }

  const rawName = (name || "").trim().toLowerCase();
  const rawId = (id || "").trim().toLowerCase();

  // 1. Direct match in categoryIconMap by id or name
  if (categoryIconMap[rawId]) {
    return categoryIconMap[rawId];
  }
  if (categoryIconMap[rawName]) {
    return categoryIconMap[rawName];
  }

  // Normalize string (remove accents and special characters)
  const normalized = `${rawName} ${rawId}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 2. Normalized direct match
  for (const [key, icon] of Object.entries(categoryIconMap)) {
    const normKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalized === normKey || rawId === normKey) {
      return icon;
    }
  }

  // 3. Keyword heuristic search against categoryIconMap keywords
  if (normalized.includes("pan") || normalized.includes("reposteri") || normalized.includes("bolleria") || normalized.includes("bakery")) {
    return categoryIconMap["panaderia"] || Croissant;
  }
  if (normalized.includes("frut") || normalized.includes("verdur") || normalized.includes("hortaliz") || normalized.includes("produce")) {
    return categoryIconMap["frutas"] || Apple;
  }
  if (normalized.includes("lacte") || normalized.includes("leche") || normalized.includes("queso") || normalized.includes("yogur") || normalized.includes("dairy")) {
    return categoryIconMap["lacteos"] || Milk;
  }
  if (normalized.includes("carne") || normalized.includes("pollo") || normalized.includes("res") || normalized.includes("cerdo") || normalized.includes("meat")) {
    return categoryIconMap["carnes"] || Beef;
  }
  if (normalized.includes("pescad") || normalized.includes("marisc") || normalized.includes("mar") || normalized.includes("fish")) {
    return categoryIconMap["pescados"] || Fish;
  }
  if (normalized.includes("bebid") || normalized.includes("refresc") || normalized.includes("jugo") || normalized.includes("agua") || normalized.includes("gaseos") || normalized.includes("drink")) {
    return categoryIconMap["bebidas"] || Coffee;
  }
  if (normalized.includes("vino") || normalized.includes("licor") || normalized.includes("cervez") || normalized.includes("alcohol") || normalized.includes("wine")) {
    return categoryIconMap["vinos"] || Wine;
  }
  if (normalized.includes("limpiez") || normalized.includes("aseo") || normalized.includes("detergent") || normalized.includes("desinfect") || normalized.includes("clean")) {
    return categoryIconMap["limpieza"] || Sparkles;
  }
  if (normalized.includes("bebe") || normalized.includes("infantil") || normalized.includes("panal") || normalized.includes("baby")) {
    return categoryIconMap["bebes"] || Baby;
  }
  if (normalized.includes("mascot") || normalized.includes("perro") || normalized.includes("gato") || normalized.includes("pet")) {
    return categoryIconMap["mascotas"] || Dog;
  }
  if (normalized.includes("util") || normalized.includes("hogar") || normalized.includes("casa") || normalized.includes("bazar") || normalized.includes("home")) {
    return categoryIconMap["utiles"] || HomeIcon;
  }
  if (normalized.includes("primera") || normalized.includes("necesidad") || normalized.includes("cesta") || normalized.includes("despensa") || normalized.includes("basico") || normalized.includes("pantry")) {
    return categoryIconMap["primera-necesidad"] || ShoppingBasket;
  }
  if (normalized.includes("aliment") || normalized.includes("comida") || normalized.includes("conserv") || normalized.includes("grano") || normalized.includes("enlatad") || normalized.includes("sella") || normalized.includes("food")) {
    return categoryIconMap["alimentos"] || UtensilsCrossed;
  }
  if (normalized.includes("sopa") || normalized.includes("caldo") || normalized.includes("soup")) {
    return categoryIconMap["sopas"] || Soup;
  }
  if (normalized.includes("harin") || normalized.includes("cereal") || normalized.includes("pasta") || normalized.includes("trigo") || normalized.includes("grain")) {
    return categoryIconMap["cereales"] || Wheat;
  }

  // 4. Safe fallback to generic Lucide icon
  return DEFAULT_CATEGORY_ICON || FALLBACK_CATEGORY_ICON || Package;
}

/**
 * Returns cohesive visual color tokens per category with safe fallback
 */
function getCategoryPalette(id: string = "", name: string = "") {
  const text = `${name} ${id}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (text.includes("aliment") || text.includes("sella") || text.includes("grano")) {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200/80",
      hoverBg: "group-hover:bg-emerald-600",
      hoverText: "group-hover:text-white",
    };
  }
  if (text.includes("necesidad") || text.includes("primera") || text.includes("lacte") || text.includes("harin")) {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200/80",
      hoverBg: "group-hover:bg-amber-500",
      hoverText: "group-hover:text-white",
    };
  }
  if (text.includes("limpiez") || text.includes("aseo") || text.includes("detergent")) {
    return {
      bg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-200/80",
      hoverBg: "group-hover:bg-teal-600",
      hoverText: "group-hover:text-white",
    };
  }
  if (text.includes("util") || text.includes("hogar") || text.includes("casa")) {
    return {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200/80",
      hoverBg: "group-hover:bg-orange-500",
      hoverText: "group-hover:text-white",
    };
  }

  return {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    hoverBg: "group-hover:bg-emerald-600",
    hoverText: "group-hover:text-white",
  };
}

export const CategoryBento: React.FC<CategoryBentoProps> = ({
  onSelectCategory,
  onExploreAll,
}) => {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real categories dynamically from Supabase database
  const fetchCategoriesFromDatabase = async () => {
    setIsLoading(true);
    try {
      const { data: dbCategories, error: catError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (catError) {
        console.error("[CategoryBento] Error al consultar categories en Supabase:", catError);
        setCategories([]);
        return;
      }

      if (!dbCategories || dbCategories.length === 0) {
        setCategories([]);
        return;
      }

      // Fetch product counts dynamically from Supabase products table
      const { data: dbProducts } = await supabase
        .from("products")
        .select("category_id")
        .eq("is_active", true);

      const countMap: Record<string, number> = {};
      (dbProducts || []).forEach((p: { category_id: string }) => {
        countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      });

      const enriched: CategoryWithCount[] = dbCategories.map((cat) => ({
        ...cat,
        productCount: countMap[cat.id] ?? 0,
      }));

      setCategories(enriched);
    } catch (err) {
      console.error("[CategoryBento] Error inesperado conectando con Supabase:", err);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesFromDatabase();

    // Live Real-Time sync with Supabase tables
    const channel = supabase
      .channel("supabase-categories-live-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          fetchCategoriesFromDatabase();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchCategoriesFromDatabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section id="categorias" className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-primary block mb-1.5">
              Explora por Categoría
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-deep tracking-tight text-balance">
              Categorías de Productos
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-lg font-normal leading-relaxed">
              Selecciona una categoría para explorar los productos de nuestro catálogo.
            </p>
          </div>

          <button
            type="button"
            onClick={onExploreAll}
            className="self-start sm:self-auto inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-brand-deep min-h-[44px] px-5 py-2.5 rounded-full border border-border bg-white hover:border-[#CBD5CE] transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <span>Ver tienda completa</span>
            <ArrowRight className="size-4" />
          </button>
        </div>

        {/* Dynamic Vectorial Icon Grid / Empty State Check */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-6 sm:p-7 rounded-3xl bg-white border border-border animate-pulse"
              >
                <div className="size-18 sm:size-20 rounded-2xl sm:rounded-3xl bg-muted/60 mb-3.5" />
                <div className="h-4 w-24 bg-muted/60 rounded-full mb-1.5" />
                <div className="h-3 w-16 bg-muted/40 rounded-full" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          /* Stylized Minimalist Empty State Container when categories array length is 0 */
          <div className="rounded-3xl border border-border bg-white p-8 sm:p-12 text-center shadow-xs">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-muted/50 text-muted-foreground mb-3 border border-border/60">
              <Package className="size-8" />
            </div>
            <p className="text-base font-bold text-brand-deep">
              No existen categorías disponibles aún
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              Las categorías se actualizarán automáticamente desde la base de datos de Supabase.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {categories.map((cat) => {
              const IconComponent = getDynamicCategoryIcon(cat?.name, cat?.id) || DEFAULT_CATEGORY_ICON || Package;
              const palette = getCategoryPalette(cat?.id, cat?.name);
              const count = cat?.productCount ?? 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id as CategoryId)}
                  className="group relative flex flex-col items-center justify-center rounded-3xl bg-white border border-border hover:border-[#CBD5CE] p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-300 active:scale-95 cursor-pointer text-center"
                  aria-label={`Ver categoría ${cat.name || "Categoría"}`}
                >
                  {/* Dynamic Lucide Vectorial Icon Container */}
                  <div
                    className={`size-18 sm:size-20 rounded-2xl sm:rounded-3xl ${palette.bg} ${palette.text} ${palette.border} border ${palette.hoverBg} ${palette.hoverText} transition-all duration-300 shadow-2xs group-hover:shadow-md flex items-center justify-center group-hover:scale-105`}
                  >
                    <IconComponent className="size-8 sm:size-9 transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  {/* Dynamic Category Name from Supabase */}
                  <span className="mt-4 text-sm sm:text-base font-bold text-brand-deep group-hover:text-primary transition-colors line-clamp-1">
                    {cat.short_name || cat.name || "Categoría"}
                  </span>

                  {/* Dynamic Product Count */}
                  <span className="mt-1 text-xs text-muted-foreground font-medium">
                    {count} {count === 1 ? "producto" : "productos"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
