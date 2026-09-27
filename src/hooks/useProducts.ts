import { useState, useEffect, useCallback } from "react";
import { ProductItem } from "@/data/products";
import { getProductItems } from "@/services/products";

export function useProducts() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await getProductItems();
      setProducts(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar el catálogo de Supabase.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return {
    products,
    setProducts,
    isLoading,
    error,
    refreshProducts: fetchCatalog,
  };
}
