import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category, ProductFormData } from "@/types/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order");

    if (!error) {
      setCategories((data || []) as Category[]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        option_groups(count)
      `)
      .order("display_order");

    if (!error) {
      const mapped = (data || []).map((p: any) => ({
        ...p,
        option_groups_count: Array.isArray(p.option_groups) && p.option_groups[0]
          ? Number(p.option_groups[0].count) || 0
          : 0,
      }));
      setProducts(mapped as Product[]);
    }
    setLoading(false);
  }, []);


  useEffect(() => {
    fetchCategories();
    fetchProducts();

    // Subscribe to realtime changes
    const productsChannel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    const categoriesChannel = supabase
      .channel("categories-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [fetchCategories, fetchProducts]);

  const createProduct = async (data: ProductFormData) => {
    const { data: newProduct, error } = await supabase
      .from("products")
      .insert({
        name: data.name,
        description: data.description || null,
        category_id: data.category_id || null,
        price_pequena: data.price_pequena,
        price_media: data.price_media,
        price_grande: data.price_grande,
        is_active: data.is_active,
        is_featured: data.is_featured,
        track_stock: data.track_stock,
        stock_quantity: data.track_stock ? data.stock_quantity : null,
        sold_by_weight: data.sold_by_weight,
        price_per_kg: data.sold_by_weight ? data.price_per_kg : null,
        availability: data.availability,
        availability_pequena: data.availability_pequena,
        availability_media: data.availability_media,
        availability_grande: data.availability_grande,
        cost_price: data.cost_price,
        price_multiplier: data.price_multiplier,
        is_combo: data.is_combo,
        serves: data.serves,
        sale_start: data.sale_start,
        sale_end: data.sale_end,
        combo_items: data.combo_items as unknown as any,
      })
      .select()
      .single();


    if (error) {
      return { error };
    }

    return { error: null, data: newProduct };
  };

  const updateProduct = async (id: string, data: Partial<ProductFormData>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      description: data.description || null,
    };
    
    // If disabling stock tracking, clear stock quantity
    if (data.track_stock === false) {
      updateData.stock_quantity = null;
    }
    
    // If disabling weight-based sales, clear price per kg
    if (data.sold_by_weight === false) {
      updateData.price_per_kg = null;
    }
    
    const { error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id);

    return { error };
  };

  const updateStock = async (id: string, quantity: number) => {
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: quantity })
      .eq("id", id);

    return { error };
  };

  const toggleProductActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .eq("id", id);

    return { error };
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    return { error };
  };

  // Category management
  const createCategory = async (name: string, icon: string) => {
    const { data, error } = await supabase
      .from("categories")
      .insert({ name, icon })
      .select()
      .single();

    return { error, data };
  };

  const updateCategory = async (id: string, name: string, icon: string) => {
    const { error } = await supabase
      .from("categories")
      .update({ name, icon })
      .eq("id", id);

    return { error };
  };

  return {
    products,
    categories,
    loading,
    createProduct,
    updateProduct,
    updateStock,
    toggleProductActive,
    deleteProduct,
    createCategory,
    updateCategory,
    refresh: fetchProducts,
  };
}
