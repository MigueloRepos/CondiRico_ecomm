import { useState, useEffect, useCallback } from "react";
import { CategoryInfo } from "@/data/products";
import { getCategories, mapCategoryFromDatabase } from "@/services/categories";

export function useCategories() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbCategories = await getCategories();
      const mapped = dbCategories.map(mapCategoryFromDatabase);
      setCategories(mapped);
    } catch (err) {
      console.error("[useCategories] Error loading categories:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    refreshCategories: fetchCategories,
  };
}
