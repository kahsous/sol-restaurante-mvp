import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock_quantity: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export interface ProductRecipe {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  created_at: string;
  ingredient?: Ingredient;
}

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIngredients = useCallback(async () => {
    const { data } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");
    if (data) setIngredients(data as Ingredient[]);
  }, []);

  const fetchRecipes = useCallback(async () => {
    const { data } = await supabase
      .from("product_recipes")
      .select("*, ingredient:ingredients(*)")
      .order("created_at");
    if (data) setRecipes(data as ProductRecipe[]);
  }, []);

  useEffect(() => {
    Promise.all([fetchIngredients(), fetchRecipes()]).then(() => setLoading(false));
  }, [fetchIngredients, fetchRecipes]);

  const createIngredient = async (data: Partial<Ingredient>) => {
    const { error } = await supabase.from("ingredients").insert(data as any);
    if (!error) await fetchIngredients();
    return { error };
  };

  const updateIngredient = async (id: string, data: Partial<Ingredient>) => {
    const { error } = await supabase.from("ingredients").update(data as any).eq("id", id);
    if (!error) await fetchIngredients();
    return { error };
  };

  const deleteIngredient = async (id: string) => {
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    if (!error) await fetchIngredients();
    return { error };
  };

  const addRecipeItem = async (productId: string, ingredientId: string, quantity: number, unit: string) => {
    const { error } = await supabase.from("product_recipes").insert({
      product_id: productId,
      ingredient_id: ingredientId,
      quantity,
      unit,
    });
    if (!error) await fetchRecipes();
    return { error };
  };

  const removeRecipeItem = async (id: string) => {
    const { error } = await supabase.from("product_recipes").delete().eq("id", id);
    if (!error) await fetchRecipes();
    return { error };
  };

  const getProductRecipes = useCallback(
    (productId: string) => recipes.filter((r) => r.product_id === productId),
    [recipes]
  );

  const getProductCost = useCallback(
    (productId: string) => {
      const items = recipes.filter((r) => r.product_id === productId);
      return items.reduce((sum, r) => {
        const ing = ingredients.find((i) => i.id === r.ingredient_id);
        if (!ing) return sum;
        return sum + r.quantity * ing.cost_per_unit;
      }, 0);
    },
    [recipes, ingredients]
  );

  return {
    ingredients,
    recipes,
    loading,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    addRecipeItem,
    removeRecipeItem,
    getProductRecipes,
    getProductCost,
    refresh: () => Promise.all([fetchIngredients(), fetchRecipes()]),
  };
}
