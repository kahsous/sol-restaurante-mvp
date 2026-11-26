import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StockMovement {
  id: string;
  product_id: string;
  type: "entry" | "exit" | "adjustment";
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
  product?: { name: string } | null;
}

export function useStockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMovements = useCallback(async (productId?: string) => {
    setLoading(true);
    let query = supabase
      .from("stock_movements")
      .select("*, product:products(name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;
    if (!error) {
      setMovements((data || []) as StockMovement[]);
    }
    setLoading(false);
  }, []);

  const registerEntry = useCallback(async (
    productId: string,
    quantity: number,
    currentStock: number,
    reason?: string,
    userId?: string
  ) => {
    const newStock = currentStock + quantity;

    // Update product stock
    const { error: stockError } = await supabase
      .from("products")
      .update({ stock_quantity: newStock })
      .eq("id", productId);

    if (stockError) return { error: stockError };

    // Register movement
    const { error } = await supabase.from("stock_movements").insert({
      product_id: productId,
      type: "entry",
      quantity,
      previous_stock: currentStock,
      new_stock: newStock,
      reason: reason || "Entrada de mercadoria",
      created_by: userId || null,
    });

    return { error };
  }, []);

  const registerAdjustment = useCallback(async (
    productId: string,
    newQuantity: number,
    currentStock: number,
    reason?: string,
    userId?: string
  ) => {
    const diff = newQuantity - currentStock;

    const { error: stockError } = await supabase
      .from("products")
      .update({ stock_quantity: newQuantity })
      .eq("id", productId);

    if (stockError) return { error: stockError };

    const { error } = await supabase.from("stock_movements").insert({
      product_id: productId,
      type: "adjustment",
      quantity: diff,
      previous_stock: currentStock,
      new_stock: newQuantity,
      reason: reason || "Ajuste manual de estoque",
      created_by: userId || null,
    });

    return { error };
  }, []);

  return {
    movements,
    loading,
    fetchMovements,
    registerEntry,
    registerAdjustment,
  };
}
