import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, UtensilsCrossed, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Tab } from "@/types/tab";
import type { CartItem } from "@/types/menu";
import { TAB_STATUS_LABELS, TAB_STATUS_COLORS } from "@/types/tab";

export default function ComandaView() {
  const { number } = useParams<{ number: string }>();
  
  const [tab, setTab] = useState<Tab | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchTab = async () => {
      if (!number) return;
      const tabNumber = parseInt(number);
      if (isNaN(tabNumber)) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase
        .rpc("get_tab_by_number", { _tab_number: tabNumber });

      if (error || !data) {
        setNotFound(true);
      } else {
        const tabData = data as unknown as Record<string, any>;
        setTab({
          ...tabData,
          items: (tabData.items || []) as unknown as CartItem[],
          status: tabData.status as Tab["status"],
          tab_number: tabData.tab_number ?? tabNumber,
        } as Tab);
      }
      setLoading(false);
    };

    fetchTab();

    // Realtime updates
    const channel = supabase
      .channel(`tab-${number}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tabs", filter: `tab_number=eq.${number}` }, (payload) => {
        if (payload.new) {
          setTab({
            ...payload.new as any,
            items: (payload.new.items || []) as unknown as CartItem[],
            status: payload.new.status as Tab["status"],
            tab_number: payload.new.tab_number ?? parseInt(number || "0"),
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [number]);

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !tab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">Comanda não encontrada</h1>
          <p className="text-muted-foreground mb-4">Verifique o número da comanda</p>
          <p className="text-sm text-muted-foreground">Solicite ajuda ao garçom</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-mono">Comanda {tab.code}</h1>
            {tab.customer_name && <p className="text-sm text-muted-foreground">{tab.customer_name}</p>}
          </div>
          <Badge className={TAB_STATUS_COLORS[tab.status]}>{TAB_STATUS_LABELS[tab.status]}</Badge>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-4">
        {tab.status === "free" ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Comanda livre</p>
              <p className="text-sm text-muted-foreground mt-1">Solicite ao garçom para abrir esta comanda</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Itens Consumidos</CardTitle>
              </CardHeader>
              <CardContent>
                {tab.items.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum item ainda</p>
                ) : (
                  <div className="space-y-2">
                    {tab.items.map((item, i) => {
                      const price = item.size === "media" ? item.priceMedia : item.priceGrande;
                      return (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.size === "media" ? "Média" : "Grande"} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-mono font-semibold">{formatCurrency(price * item.quantity)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(tab.subtotal)}</span>
                </div>
              </CardContent>
            </Card>

            {tab.status === "awaiting_payment" && (
              <Card className="border-yellow-400">
                <CardContent className="py-4 text-center">
                  <p className="text-yellow-700 dark:text-yellow-400 font-medium">
                    ⏳ Aguardando pagamento no caixa
                  </p>
                </CardContent>
              </Card>
            )}

            {tab.notes && (
              <Card>
                <CardContent className="py-3">
                  <p className="text-sm text-muted-foreground">📝 {tab.notes}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
