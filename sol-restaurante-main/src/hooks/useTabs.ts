import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tab, TabStatus } from "@/types/tab";
import type { CartItem } from "@/types/menu";

export function useTabs() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const { toast } = useToast();

  const transformTab = (tab: any): Tab => ({
    ...tab,
    items: (tab.items as unknown as CartItem[]) || [],
    status: tab.status as TabStatus,
  });

  const fetchTabs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tabs")
      .select("*")
      .order("tab_number", { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar comandas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTabs((data || []).map(transformTab));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  // Open a comanda by number (set status to "open")
  const openTab = useCallback(
    async (tabNumber: number, customerName?: string) => {
      const existing = tabs.find((t) => t.tab_number === tabNumber);
      if (!existing) {
        toast({ title: "Comanda não encontrada", variant: "destructive" });
        return null;
      }

      if (existing.status !== "free") {
        // If already open/consuming, just select it
        if (existing.status === "open" || existing.status === "consuming") {
          setActiveTab(existing);
          return existing;
        }
        toast({
          title: "Comanda indisponível",
          description: `Comanda ${existing.code} está ${existing.status === "awaiting_payment" ? "aguardando pagamento" : "finalizada"}`,
          variant: "destructive",
        });
        return null;
      }

      const { error } = await supabase
        .from("tabs")
        .update({
          status: "open",
          customer_name: customerName || null,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          items: [] as unknown as any,
          subtotal: 0,
          notes: null,
          closed_at: null,
        })
        .eq("id", existing.id);

      if (error) {
        toast({ title: "Erro ao abrir comanda", description: error.message, variant: "destructive" });
        return null;
      }

      const updated = { ...existing, status: "open" as TabStatus, customer_name: customerName || null, items: [], subtotal: 0 };
      setTabs((prev) => prev.map((t) => (t.id === existing.id ? updated : t)));
      setActiveTab(updated);
      toast({ title: "Comanda aberta", description: `Comanda ${existing.code}` });
      return updated;
    },
    [tabs, toast]
  );

  // Find tab by number
  const findTabByNumber = useCallback(
    (tabNumber: number): Tab | null => {
      return tabs.find((t) => t.tab_number === tabNumber) || null;
    },
    [tabs]
  );

  // Update items on a tab
  const updateTabItems = useCallback(
    async (tabId: string, items: CartItem[]) => {
      const subtotal = items.reduce((acc, item) => {
        const price = item.size === "media" ? item.priceMedia : item.priceGrande;
        return acc + price * item.quantity;
      }, 0);

      const newStatus: TabStatus = items.length > 0 ? "consuming" : "open";

      const { error } = await supabase
        .from("tabs")
        .update({ items: items as unknown as any, subtotal, status: newStatus })
        .eq("id", tabId);

      if (error) {
        toast({ title: "Erro ao atualizar comanda", description: error.message, variant: "destructive" });
        return false;
      }

      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, items, subtotal, status: newStatus } : t))
      );
      if (activeTab?.id === tabId) {
        setActiveTab((prev) => (prev ? { ...prev, items, subtotal, status: newStatus } : null));
      }
      return true;
    },
    [activeTab, toast]
  );

  // Request payment (moves to awaiting_payment)
  const requestPayment = useCallback(
    async (tabId: string) => {
      const { error } = await supabase
        .from("tabs")
        .update({ status: "awaiting_payment", closed_at: new Date().toISOString() })
        .eq("id", tabId);

      if (error) {
        toast({ title: "Erro ao solicitar pagamento", description: error.message, variant: "destructive" });
        return false;
      }

      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, status: "awaiting_payment" as TabStatus } : t))
      );
      toast({ title: "Comanda enviada ao caixa", description: "Aguardando pagamento" });
      return true;
    },
    [toast]
  );

  // Finalize tab (after payment - resets to free)
  const finalizeTab = useCallback(
    async (tabId: string) => {
      const { error } = await supabase
        .from("tabs")
        .update({
          status: "free",
          items: [] as unknown as any,
          subtotal: 0,
          customer_name: null,
          notes: null,
          created_by: null,
          closed_at: null,
        })
        .eq("id", tabId);

      if (error) {
        toast({ title: "Erro ao finalizar comanda", description: error.message, variant: "destructive" });
        return false;
      }

      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? { ...t, status: "free" as TabStatus, items: [], subtotal: 0, customer_name: null, notes: null }
            : t
        )
      );

      if (activeTab?.id === tabId) {
        setActiveTab(null);
      }

      toast({ title: "Comanda finalizada", description: "Número liberado para uso" });
      return true;
    },
    [activeTab, toast]
  );

  // Cancel tab (admin only - resets to free)
  const cancelTab = useCallback(
    async (tabId: string) => {
      const { error } = await supabase
        .from("tabs")
        .update({
          status: "free",
          items: [] as unknown as any,
          subtotal: 0,
          customer_name: null,
          notes: null,
          created_by: null,
          closed_at: null,
        })
        .eq("id", tabId);

      if (error) {
        toast({ title: "Erro ao cancelar comanda", description: error.message, variant: "destructive" });
        return false;
      }

      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? { ...t, status: "free" as TabStatus, items: [], subtotal: 0, customer_name: null, notes: null }
            : t
        )
      );

      if (activeTab?.id === tabId) {
        setActiveTab(null);
      }

      toast({ title: "Comanda cancelada", description: "Número liberado" });
      return true;
    },
    [activeTab, toast]
  );

  return {
    tabs,
    loading,
    activeTab,
    setActiveTab,
    fetchTabs,
    openTab,
    findTabByNumber,
    updateTabItems,
    requestPayment,
    finalizeTab,
    cancelTab,
  };
}
