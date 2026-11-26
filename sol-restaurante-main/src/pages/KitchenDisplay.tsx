import { useState, useEffect } from "react";
import { ChefHat, Clock, CheckCircle, Flame, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type KitchenOrder = {
  id: string;
  type: "order" | "tab";
  label: string;
  items: { name: string; quantity: number; size: string; notes?: string }[];
  notes: string | null;
  status: string;
  created_at: string;
  customer_name: string | null;
};

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setAuthChecked(true);
        return;
      }
      // Check if user has cozinha or admin role
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      const role = data?.role as string | null;
      setAuthorized(role === "admin" || role === "cozinha");
      setAuthChecked(true);
    });
  }, []);

  const fetchAll = async () => {
    // Fetch pending/preparing orders
    const { data: onlineOrders } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "preparing"])
      .order("created_at", { ascending: true });

    // Fetch open/consuming tabs
    const { data: tabOrders } = await supabase
      .from("tabs")
      .select("*")
      .in("status", ["open", "consuming"])
      .order("created_at", { ascending: true });

    const mapped: KitchenOrder[] = [];

    (onlineOrders || []).forEach((o) => {
      mapped.push({
        id: o.id,
        type: "order",
        label: `DELIVERY #${o.id.slice(0, 6).toUpperCase()}`,
        items: ((o.items as any[]) || []).map((i: any) => ({
          name: i.name,
          quantity: i.quantity || 1,
          size: i.size || "media",
          notes: i.notes,
        })),
        notes: o.notes as string | null,
        status: o.status as string,
        created_at: o.created_at as string,
        customer_name: o.guest_name as string | null,
      });
    });

    (tabOrders || []).forEach((t) => {
      const items = (t.items as any[]) || [];
      if (items.length === 0) return;
      mapped.push({
        id: t.id,
        type: "tab",
        label: `COMANDA ${t.code || t.tab_number}`,
        items: items.map((i: any) => ({
          name: i.name,
          quantity: i.quantity || 1,
          size: i.size || "media",
          notes: i.notes,
        })),
        notes: t.notes as string | null,
        status: t.status as string,
        created_at: t.created_at as string,
        customer_name: t.customer_name as string | null,
      });
    });

    setOrders(mapped);
  };

  useEffect(() => {
    if (!authorized) return;
    fetchAll();

    const ch1 = supabase
      .channel("kitchen-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchAll())
      .subscribe();

    const ch2 = supabase
      .channel("kitchen-tabs")
      .on("postgres_changes", { event: "*", schema: "public", table: "tabs" }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [authorized]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">
            Esta tela é exclusiva para a equipe de cozinha e administradores.
          </p>
          <Button onClick={() => window.location.href = "/admin/pdv"} variant="default">
            Ir para Login do PDV
          </Button>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (order: KitchenOrder, newStatus: string) => {
    if (order.type === "order") {
      const updateData: any = { status: newStatus };
      if (newStatus === "preparing") updateData.prep_started_at = new Date().toISOString();
      if (newStatus === "ready") updateData.prep_finished_at = new Date().toISOString();
      await supabase.from("orders").update(updateData).eq("id", order.id);
    }
    // For tabs we don't change status from kitchen
    fetchAll();
  };

  const getElapsed = (createdAt: string) => {
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return mins < 60 ? `${mins}min` : `${Math.floor(mins / 60)}h${mins % 60}m`;
  };

  const pendingOrders = orders.filter((o) => o.type === "order" && o.status === "pending");
  const preparingOrders = orders.filter((o) => o.type === "order" && o.status === "preparing");
  const tabOrders = orders.filter((o) => o.type === "tab");

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ChefHat className="h-7 w-7" /> Tela de Produção - Cozinha
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Pedidos: {pendingOrders.length} novos • {preparingOrders.length} em preparo</span>
          <span>Comandas: {tabOrders.length}</span>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Pending */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-yellow-600">
            <Clock className="h-5 w-5" /> Novos ({pendingOrders.length})
          </h2>
          <div className="space-y-3">
            {pendingOrders.map((o) => (
              <KitchenCard key={o.id} order={o} elapsed={getElapsed(o.created_at)}>
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange(o, "preparing")}>
                  <Flame className="h-4 w-4 mr-1" /> EM PREPARO
                </Button>
              </KitchenCard>
            ))}
          </div>
        </div>

        {/* Preparing */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-blue-600">
            <Flame className="h-5 w-5" /> Em Preparo ({preparingOrders.length})
          </h2>
          <div className="space-y-3">
            {preparingOrders.map((o) => (
              <KitchenCard key={o.id} order={o} elapsed={getElapsed(o.created_at)}>
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(o, "ready")}>
                  <CheckCircle className="h-4 w-4 mr-1" /> MARCAR COMO PRONTO
                </Button>
              </KitchenCard>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-primary">
            <ChefHat className="h-5 w-5" /> Comandas ({tabOrders.length})
          </h2>
          <div className="space-y-3">
            {tabOrders.map((o) => (
              <KitchenCard key={o.id} order={o} elapsed={getElapsed(o.created_at)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KitchenCard({ order, elapsed, children }: { order: KitchenOrder; elapsed: string; children?: React.ReactNode }) {
  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-lg">{order.label}</span>
          <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{elapsed}</Badge>
        </div>
        {order.customer_name && <p className="text-sm text-muted-foreground">{order.customer_name}</p>}
      </CardHeader>
      <CardContent className="space-y-2">
        {order.items.map((item, i) => (
          <div key={i} className="text-sm">
            <span className="font-bold">{item.quantity}x</span> {item.name}
            <span className="text-muted-foreground ml-1">({item.size === "media" ? "M" : "G"})</span>
            {item.notes && <p className="text-xs font-bold text-destructive mt-0.5">*** {item.notes.toUpperCase()} ***</p>}
          </div>
        ))}
        {order.notes && (
          <div className="bg-amber-100 dark:bg-amber-950 p-2 rounded text-sm font-bold">
            *** {order.notes.toUpperCase()} ***
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
