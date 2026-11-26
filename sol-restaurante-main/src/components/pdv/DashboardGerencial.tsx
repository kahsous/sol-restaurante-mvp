import { useState, useEffect } from "react";
import { TrendingUp, ShoppingCart, Store, Truck, DollarSign, Clock, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/types/pdv";

type Period = "today" | "week" | "month";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function DashboardGerencial() {
  const [orders, setOrders] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const now = new Date();
      let from: Date;
      if (period === "today") {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === "week") {
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const { data } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", from.toISOString())
        .eq("status", "completed");

      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, [period]);

  // Also fetch tabs for in-house sales
  const [tabs, setTabs] = useState<any[]>([]);
  useEffect(() => {
    const fetchTabs = async () => {
      const now = new Date();
      let from: Date;
      if (period === "today") {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === "week") {
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const { data } = await supabase
        .from("tabs")
        .select("*")
        .gte("created_at", from.toISOString())
        .neq("status", "free");
      setTabs(data || []);
    };
    fetchTabs();
  }, [period]);

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0) + tabs.filter(t => t.status === "closed" || t.status === "awaiting_payment").reduce((s, t) => s + (t.subtotal || 0), 0);
  const deliveryOrders = orders.filter(o => o.guest_address_street || o.address_id);
  const pickupOrders = orders.filter(o => !o.guest_address_street && !o.address_id);
  const deliveryRevenue = deliveryOrders.reduce((s, o) => s + (o.total || 0), 0);
  const tabRevenue = tabs.filter(t => t.status === "closed" || t.status === "awaiting_payment").reduce((s, t) => s + (t.subtotal || 0), 0);
  const totalOrders = orders.length + tabs.filter(t => t.status !== "free" && t.status !== "open").length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Product ranking
  const productCounts: Record<string, { name: string; qty: number; revenue: number }> = {};
  orders.forEach(o => {
    const items = (o.items || []) as any[];
    items.forEach((item: any) => {
      const key = item.name || item.id;
      if (!productCounts[key]) productCounts[key] = { name: item.name || "?", qty: 0, revenue: 0 };
      productCounts[key].qty += item.quantity || 1;
      const price = item.size === "media" ? (item.priceMedia || 0) : (item.priceGrande || 0);
      productCounts[key].revenue += price * (item.quantity || 1);
    });
  });
  tabs.forEach(t => {
    const items = (t.items || []) as any[];
    items.forEach((item: any) => {
      const key = item.name || item.id;
      if (!productCounts[key]) productCounts[key] = { name: item.name || "?", qty: 0, revenue: 0 };
      productCounts[key].qty += item.quantity || 1;
      const price = item.size === "media" ? (item.priceMedia || 0) : (item.priceGrande || 0);
      productCounts[key].revenue += price * (item.quantity || 1);
    });
  });
  const ranking = Object.values(productCounts).sort((a, b) => b.qty - a.qty).slice(0, 10);

  // Peak hours
  const hourCounts = Array(24).fill(0);
  const dayCounts = Array(7).fill(0);
  [...orders, ...tabs.filter(t => t.status !== "free")].forEach(o => {
    const d = new Date(o.created_at);
    hourCounts[d.getHours()]++;
    dayCounts[d.getDay()]++;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const peakDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Dashboard Gerencial
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
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Faturamento</p>
                <p className="text-lg font-bold text-primary">{fmt(totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-xs text-muted-foreground">Pedidos</p>
                <p className="text-lg font-bold">{totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Store className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-xs text-muted-foreground">Salão</p>
                <p className="text-lg font-bold text-green-600">{fmt(tabRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Truck className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="text-lg font-bold text-purple-600">{fmt(deliveryRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-lg font-bold text-amber-600">{fmt(avgTicket)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-rose-500" />
                <p className="text-xs text-muted-foreground">Horário Pico</p>
                <p className="text-lg font-bold">{peakHour}h • {peakDay}</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Products Ranking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🏆 Top 10 Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {ranking.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados no período</p>
              ) : (
                <div className="space-y-2">
                  {ranking.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <Badge variant={i < 3 ? "default" : "secondary"} className="w-7 h-7 flex items-center justify-center rounded-full text-xs">
                        {i + 1}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{item.qty} vendas</p>
                        <p className="text-xs text-muted-foreground">{fmt(item.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Peak Hours Chart */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">📊 Vendas por Horário</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32">
                  {hourCounts.map((count, h) => {
                    const max = Math.max(...hourCounts, 1);
                    const height = (count / max) * 100;
                    return (
                      <div key={h} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-primary/20 rounded-t relative" style={{ height: `${height}%`, minHeight: count > 0 ? 4 : 0 }}>
                          {count > 0 && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px]">{count}</span>}
                        </div>
                        {h % 3 === 0 && <span className="text-[8px] text-muted-foreground mt-1">{h}h</span>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">📅 Vendas por Dia da Semana</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-32">
                  {dayCounts.map((count, d) => {
                    const max = Math.max(...dayCounts, 1);
                    const height = (count / max) * 100;
                    return (
                      <div key={d} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-primary/20 rounded-t" style={{ height: `${height}%`, minHeight: count > 0 ? 4 : 0 }} />
                        <span className="text-[9px] text-muted-foreground mt-1">{dayNames[d]}</span>
                        <span className="text-[8px] font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
