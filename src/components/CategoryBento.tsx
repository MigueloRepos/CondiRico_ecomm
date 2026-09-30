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
 * Robust dynamic Lucide vectorial icon mapper for any Supabase category
 * Handles unknown categories with a reliable default Package icon.
 */
function getDynamicCategoryIcon(name: string = "", id: string = ""): React.ElementType {
  const text = `${name} ${id}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (text.includes("pan") || text.includes("reposteri") || text.includes("bolleria") || text.includes("bakery")) {
    return Croissant;
  }
  if (text.includes("frut") || text.includes("verdur") || text.includes("hortaliz") || text.includes("produce")) {
    return Apple;
  }
  if (text.includes("lacte") || text.includes("leche") || text.includes("queso") || text.includes("yogur") || text.includes("dairy")) {
    return Milk;
  }
  if (text.includes("carne") || text.includes("pollo") || text.includes("res") || text.includes("cerdo") || text.includes("meat")) {
    return Beef;
  }
  if (text.includes("pescad") || text.includes("marisc") || text.includes("mar") || text.includes("fish")) {
    return Fish;
  }
  if (text.includes("bebid") || text.includes("refresc") || text.includes("jugo") || text.includes("agua") || text.includes("gaseos") || text.includes("drink")) {
    return Coffee;
  }
  if (text.includes("vino") || text.includes("licor") || text.includes("cervez") || text.includes("alcohol") || text.includes("wine")) {
    return Wine;
  }
  if (text.includes("limpiez") || text.includes("aseo") || text.includes("detergent") || text.includes("desinfect") || text.includes("clean")) {
    return Sparkles;
  }
  if (text.includes("bebe") || text.includes("infantil") || text.includes("panal") || text.includes("baby")) {
    return Baby;
  }
  if (text.includes("mascot") || text.includes("perro") || text.includes("gato") || text.includes("pet")) {
    return Dog;
  }
  if (text.includes("util") || text.includes("hogar") || text.includes("casa") || text.includes("bazar") || text.includes("home")) {
    return HomeIcon;
  }
  if (text.includes("primera") || text.includes("necesidad") || text.includes("cesta") || text.includes("despensa") || text.includes("basico") || text.includes("pantry")) {
    return ShoppingBasket;
  }
  if (text.includes("aliment") || text.includes("comida") || text.includes("conserv") || text.includes("grano") || text.includes("enlatad") || text.includes("sella") || text.includes("food")) {
    return UtensilsCrossed;
  }
  if (text.includes("sopa") || text.includes("caldo") || text.includes("soup")) {
    return Soup;
  }
  if (text.includes("harin") || text.includes("cereal") || text.includes("pasta") || text.includes("trigo") || text.includes("grain")) {
    return Wheat;
  }

  // Default fallback icon for unknown categories
  return Package;
}

/**
 * Returns cohesive visual color tokens per category
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
              const IconComponent = getDynamicCategoryIcon(cat.name, cat.id);
              const palette = getCategoryPalette(cat.id, cat.name);
              const count = cat.productCount ?? 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id as CategoryId)}
                  className="group relative flex flex-col items-center justify-center rounded-3xl bg-white border border-border hover:border-[#CBD5CE] p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-300 active:scale-95 cursor-pointer text-center"
                  aria-label={`Ver categoría ${cat.name}`}
                >
                  {/* Dynamic Lucide Vectorial Icon Container */}
                  <div
                    className={`size-18 sm:size-20 rounded-2xl sm:rounded-3xl ${palette.bg} ${palette.text} ${palette.border} border ${palette.hoverBg} ${palette.hoverText} transition-all duration-300 shadow-2xs group-hover:shadow-md flex items-center justify-center group-hover:scale-105`}
                  >
                    <IconComponent className="size-8 sm:size-9 transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  {/* Dynamic Category Name from Supabase */}
                  <span className="mt-4 text-sm sm:text-base font-bold text-brand-deep group-hover:text-primary transition-colors line-clamp-1">
                    {cat.short_name || cat.name}
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
