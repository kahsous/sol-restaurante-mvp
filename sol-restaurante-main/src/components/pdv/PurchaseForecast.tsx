import { useState, useEffect } from "react";
import { ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Ingredient, ProductRecipe } from "@/hooks/useIngredients";

const fmt = (v: number) => v.toFixed(1);

export function PurchaseForecast({ ingredients, recipes }: { ingredients: Ingredient[]; recipes: ProductRecipe[] }) {
  const [weeklyConsumption, setWeeklyConsumption] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculate = async () => {
      setLoading(true);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [ordersRes, tabsRes] = await Promise.all([
        supabase.from("orders").select("items").gte("created_at", weekAgo).eq("status", "completed"),
        supabase.from("tabs").select("items").gte("created_at", weekAgo).neq("status", "free"),
      ]);

      const consumption: Record<string, number> = {};

      const processItems = (items: any[]) => {
        items.forEach((item: any) => {
          const productRecipes = recipes.filter(r => r.product_id === item.id);
          productRecipes.forEach(r => {
            consumption[r.ingredient_id] = (consumption[r.ingredient_id] || 0) + r.quantity * (item.quantity || 1);
          });
        });
      };

      (ordersRes.data || []).forEach(o => processItems(o.items as any[]));
      (tabsRes.data || []).forEach(t => processItems(t.items as any[]));

      setWeeklyConsumption(consumption);
      setLoading(false);
    };
    calculate();
  }, [recipes]);

  const forecasts = ingredients.map(ing => {
    const weeklyUsage = weeklyConsumption[ing.id] || 0;
    const daysLeft = weeklyUsage > 0 ? (ing.stock_quantity / weeklyUsage) * 7 : 999;
    const needsReorder = daysLeft <= 7 || ing.stock_quantity <= ing.min_stock;
    return { ...ing, weeklyUsage, daysLeft, needsReorder };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" /> Previsão de Compras
      </h2>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Calculando...</p>
      ) : (
        <>
          {/* Alerts */}
          {forecasts.filter(f => f.needsReorder).length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Ingredientes que Precisam de Reposição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {forecasts.filter(f => f.needsReorder).map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2 border border-destructive/20 rounded-lg text-sm">
                    <div>
                      <span className="font-medium">{f.name}</span>
                      <p className="text-xs text-muted-foreground">
                        Estoque: {fmt(f.stock_quantity)} {f.unit} • Consumo semanal: {fmt(f.weeklyUsage)} {f.unit}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {f.daysLeft < 999 ? `${Math.round(f.daysLeft)}d restantes` : "Sem consumo"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Full list */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Consumo Semanal de Ingredientes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {forecasts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cadastre ingredientes e receitas primeiro</p>
              ) : (
                forecasts.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{f.name}</span>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Estoque: {fmt(f.stock_quantity)} {f.unit}</span>
                        <span>Consumo/sem: {fmt(f.weeklyUsage)} {f.unit}</span>
                        <span>Mín: {fmt(f.min_stock)} {f.unit}</span>
                      </div>
                    </div>
                    <Badge variant={f.needsReorder ? "destructive" : f.daysLeft < 14 ? "secondary" : "default"}>
                      {f.daysLeft < 999 ? `${Math.round(f.daysLeft)}d` : "OK"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
