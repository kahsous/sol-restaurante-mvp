import { useState, useEffect, useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, Truck, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Ingredient, ProductRecipe } from "@/hooks/useIngredients";

type Period = "today" | "week" | "month";
const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface ProfitReportProps {
  ingredients: Ingredient[];
  recipes: ProductRecipe[];
  getProductCost: (productId: string) => number;
}

export function ProfitReport({ ingredients, recipes, getProductCost }: ProfitReportProps) {
  const [period, setPeriod] = useState<Period>("today");
  const [orders, setOrders] = useState<any[]>([]);
  const [tabs, setTabs] = useState<any[]>([]);
  const [deliveryExpenses, setDeliveryExpenses] = useState<any[]>([]);
  const [productCostMap, setProductCostMap] = useState<Record<string, number>>({});
  const [productsMap, setProductsMap] = useState<Record<string, { name: string; price_media: number }>>({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "margin" | "profit" | "qty">("profit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const now = new Date();
      let from: Date;
      if (period === "today") from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      else if (period === "week") from = new Date(now.getTime() - 7 * 86400000);
      else from = new Date(now.getFullYear(), now.getMonth(), 1);

      const [ordersRes, tabsRes, expensesRes, productsRes] = await Promise.all([
        supabase.from("orders").select("*").gte("created_at", from.toISOString()).eq("status", "completed"),
        supabase.from("tabs").select("*").gte("created_at", from.toISOString()).neq("status", "free"),
        supabase.from("delivery_expenses").select("*").gte("created_at", from.toISOString()),
        supabase.from("products").select("id, name, cost_price, price_media"),
      ]);

      setOrders(ordersRes.data || []);
      setTabs(tabsRes.data || []);
      setDeliveryExpenses(expensesRes.data || []);
      
      const costMap: Record<string, number> = {};
      const pMap: Record<string, { name: string; price_media: number }> = {};
      (productsRes.data || []).forEach((p: any) => {
        if (p.cost_price != null && p.cost_price > 0) costMap[p.id] = Number(p.cost_price);
        pMap[p.id] = { name: p.name, price_media: Number(p.price_media || 0) };
      });
      setProductCostMap(costMap);
      setProductsMap(pMap);
      setLoading(false);
    };
    fetchData();
  }, [period]);

  // Aggregate all sold items
  const allItems: any[] = [];
  orders.forEach(o => (o.items || []).forEach((i: any) => allItems.push(i)));
  tabs.filter(t => t.status !== "free" && t.status !== "open").forEach(t => (t.items || []).forEach((i: any) => allItems.push(i)));

  // Revenue
  const orderRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const tabRevenue = tabs.filter(t => t.status !== "free" && t.status !== "open").reduce((s, t) => s + (t.subtotal || 0), 0);
  const totalRevenue = orderRevenue + tabRevenue;
  const deliveryFeesCollected = orders.reduce((s, o) => s + (o.delivery_fee || 0), 0);
  const totalDeliveryExpenses = deliveryExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  // Total CMV
  let totalCMV = 0;
  allItems.forEach(item => {
    const recipeCost = getProductCost(item.id);
    const directCost = productCostMap[item.id] || 0;
    const cost = recipeCost > 0 ? recipeCost : directCost;
    totalCMV += cost * (item.quantity || 1);
  });

  const grossProfit = totalRevenue - totalCMV - totalDeliveryExpenses;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Per-product profitability
  const productProfitability = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number; cmv: number }> = {};
    allItems.forEach(item => {
      const id = item.id;
      const price = Number(item.price || 0);
      const qty = Number(item.quantity || 1);
      if (!map[id]) {
        map[id] = { name: item.name || productsMap[id]?.name || "?", qty: 0, revenue: 0, cmv: 0 };
      }
      map[id].qty += qty;
      map[id].revenue += price * qty;
      const recipeCost = getProductCost(id);
      const directCost = productCostMap[id] || 0;
      map[id].cmv += (recipeCost > 0 ? recipeCost : directCost) * qty;
    });

    return Object.entries(map).map(([id, d]) => ({
      id,
      name: d.name,
      qty: d.qty,
      revenue: d.revenue,
      cmv: d.cmv,
      profit: d.revenue - d.cmv,
      margin: d.revenue > 0 ? ((d.revenue - d.cmv) / d.revenue) * 100 : 0,
      hasRecipe: recipes.some(r => r.product_id === id),
    }));
  }, [allItems, productsMap, productCostMap, recipes, getProductCost]);

  // All products with recipes (even if not sold in period)
  const allProductsWithRecipes = useMemo(() => {
    const soldIds = new Set(productProfitability.map(p => p.id));
    const recipeProductIds = [...new Set(recipes.map(r => r.product_id))];
    const unsold = recipeProductIds
      .filter(id => !soldIds.has(id) && productsMap[id])
      .map(id => {
        const recipeCost = getProductCost(id);
        const price = productsMap[id]?.price_media || 0;
        return {
          id,
          name: productsMap[id]?.name || "?",
          qty: 0,
          revenue: 0,
          cmv: recipeCost,
          profit: price - recipeCost,
          margin: price > 0 ? ((price - recipeCost) / price) * 100 : 0,
          hasRecipe: true,
          unitPrice: price,
        };
      });
    return [
      ...productProfitability.map(p => ({ ...p, unitPrice: p.qty > 0 ? p.revenue / p.qty : 0 })),
      ...unsold,
    ];
  }, [productProfitability, recipes, productsMap, getProductCost]);

  const sorted = useMemo(() => {
    const arr = [...allProductsWithRecipes];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "margin") cmp = a.margin - b.margin;
      else if (sortBy === "profit") cmp = (a.qty > 0 ? a.profit : a.profit * -0.01) - (b.qty > 0 ? b.profit : b.profit * -0.01);
      else cmp = a.qty - b.qty;
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [allProductsWithRecipes, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const marginBadge = (m: number, hasRecipe: boolean) => {
    if (!hasRecipe) return <Badge variant="outline" className="text-xs">Sem receita</Badge>;
    if (m >= 60) return <Badge className="bg-green-500/15 text-green-700 border-green-500/30 text-xs">{m.toFixed(0)}%</Badge>;
    if (m >= 40) return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30 text-xs">{m.toFixed(0)}%</Badge>;
    return <Badge className="bg-red-500/15 text-red-700 border-red-500/30 text-xs">{m.toFixed(0)}%</Badge>;
  };

  const SortHeader = ({ col, children }: { col: typeof sortBy; children: React.ReactNode }) => (
    <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-xs" onClick={() => toggleSort(col)}>
      {children} <ArrowUpDown className="h-3 w-3 ml-1" />
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Relatório de Lucratividade
        </h2>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-xs text-muted-foreground">Faturamento</p>
                <p className="text-xl font-bold text-green-600">{fmt(totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-500" />
                <p className="text-xs text-muted-foreground">CMV Total</p>
                <p className="text-xl font-bold text-red-600">{fmt(totalCMV)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Truck className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <p className="text-xs text-muted-foreground">Entregadores</p>
                <p className="text-xl font-bold text-purple-600">{fmt(totalDeliveryExpenses)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Lucro Bruto</p>
                <p className={`text-xl font-bold ${grossProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                  {fmt(grossProfit)}
                </p>
                <p className="text-xs text-muted-foreground">Margem: {margin.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Per-product profitability table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Lucratividade por Produto</span>
                <Badge variant="outline" className="text-xs font-normal">
                  {sorted.filter(p => p.qty > 0).length} vendidos • {sorted.filter(p => p.hasRecipe).length} com receita
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><SortHeader col="name">Produto</SortHeader></TableHead>
                      <TableHead className="text-center"><SortHeader col="qty">Qtd</SortHeader></TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">CMV Unit.</TableHead>
                      <TableHead className="text-right">CMV Total</TableHead>
                      <TableHead className="text-right"><SortHeader col="profit">Lucro</SortHeader></TableHead>
                      <TableHead className="text-center"><SortHeader col="margin">Margem</SortHeader></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum produto vendido no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      sorted.map((p) => (
                        <TableRow key={p.id} className={p.qty === 0 ? "opacity-50" : ""}>
                          <TableCell className="font-medium text-sm">{p.name}</TableCell>
                          <TableCell className="text-center text-sm">{p.qty > 0 ? p.qty : "—"}</TableCell>
                          <TableCell className="text-right text-sm">{p.qty > 0 ? fmt(p.revenue) : "—"}</TableCell>
                          <TableCell className="text-right text-sm text-red-600">
                            {p.hasRecipe ? fmt(p.cmv / Math.max(p.qty, 1)) : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm text-red-600">
                            {p.qty > 0 ? fmt(p.cmv) : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {p.qty > 0 ? (
                              <span className={p.profit >= 0 ? "text-green-600" : "text-red-600"}>
                                {fmt(p.profit)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                Est. {fmt(p.profit)}/un
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{marginBadge(p.margin, p.hasRecipe)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Detalhamento</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Receita Pedidos Online</span><span className="font-medium text-green-600">{fmt(orderRevenue)}</span></div>
              <div className="flex justify-between"><span>Receita Salão (Comandas)</span><span className="font-medium text-green-600">{fmt(tabRevenue)}</span></div>
              <div className="flex justify-between"><span>Taxas de Entrega Recebidas</span><span className="font-medium text-blue-600">{fmt(deliveryFeesCollected)}</span></div>
              <div className="border-t my-2" />
              <div className="flex justify-between"><span>(-) Custo dos Ingredientes (CMV)</span><span className="font-medium text-red-600">-{fmt(totalCMV)}</span></div>
              <div className="flex justify-between"><span>(-) Pagamentos a Entregadores</span><span className="font-medium text-red-600">-{fmt(totalDeliveryExpenses)}</span></div>
              <div className="border-t my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>= Lucro Bruto</span>
                <span className={grossProfit >= 0 ? "text-primary" : "text-destructive"}>{fmt(grossProfit)}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
