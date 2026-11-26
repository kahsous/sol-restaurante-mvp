import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CashRegister, CashMovement, PaymentMethodType, MovementType } from "@/types/cashRegister";
import { PAYMENT_METHOD_CONFIG } from "@/types/cashRegister";

export function useCashRegister(userId: string | undefined) {
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchCurrentRegister = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error) {
      setCurrentRegister(data as CashRegister | null);
    }
    setLoading(false);
  }, [userId]);

  const fetchMovements = useCallback(async () => {
    if (!currentRegister) {
      setMovements([]);
      return;
    }

    const { data, error } = await supabase
      .from("cash_movements")
      .select("*")
      .eq("cash_register_id", currentRegister.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setMovements((data || []) as CashMovement[]);
    }
  }, [currentRegister]);

  useEffect(() => {
    fetchCurrentRegister();
  }, [fetchCurrentRegister]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const openRegister = async (openingBalance: number) => {
    if (!userId) return { error: new Error("Usuário não autenticado") };

    // Check if there's already a register opened today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: existingToday } = await supabase
      .from("cash_registers")
      .select("id, status")
      .gte("opened_at", todayISO)
      .limit(1)
      .maybeSingle();

    if (existingToday) {
      if (existingToday.status === "open") {
        return { error: new Error("Já existe um caixa aberto hoje.") };
      } else {
        return { error: new Error("Já foi aberto e fechado um caixa hoje. Só é permitido 1 caixa por dia.") };
      }
    }

    const { data, error } = await supabase
      .from("cash_registers")
      .insert({
        user_id: userId,
        opening_balance: openingBalance,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      return { error };
    }

    setCurrentRegister(data as CashRegister);
    return { error: null, data };
  };

  const closeRegister = async (closingBalance: number, notes?: string) => {
    if (!currentRegister) return { error: new Error("Nenhum caixa aberto") };

    // Calculate expected cash balance
    const cashMovements = movements.filter((m) => m.payment_method === "cash");
    const cashFromSales = cashMovements
      .filter((m) => m.type === "sale")
      .reduce((sum, m) => sum + Number(m.amount), 0);
    const cashDeposits = movements
      .filter((m) => m.type === "deposit")
      .reduce((sum, m) => sum + Number(m.amount), 0);
    const cashWithdrawals = movements
      .filter((m) => m.type === "withdrawal")
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const expectedCash =
      currentRegister.opening_balance + cashFromSales + cashDeposits - cashWithdrawals;

    const { error } = await supabase
      .from("cash_registers")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        closing_balance: closingBalance,
        expected_balance: expectedCash,
        notes,
      })
      .eq("id", currentRegister.id);

    if (error) {
      return { error };
    }

    setCurrentRegister(null);
    setMovements([]);
    return { error: null, difference: closingBalance - expectedCash };
  };

  const registerPayment = async (
    orderId: string,
    paymentMethod: PaymentMethodType,
    amount: number,
    description?: string
  ) => {
    if (!currentRegister) return { error: new Error("Caixa fechado. Abra o caixa antes de vender."), drawerOpened: false };

    const config = PAYMENT_METHOD_CONFIG[paymentMethod];
    const shouldOpenDrawer = config.opensDrawer;

    const { data, error } = await supabase
      .from("cash_movements")
      .insert({
        cash_register_id: currentRegister.id,
        order_id: orderId,
        type: "sale" as MovementType,
        payment_method: paymentMethod,
        amount,
        description,
        drawer_opened: shouldOpenDrawer,
      })
      .select()
      .single();

    if (error) {
      return { error, drawerOpened: false };
    }

    if (shouldOpenDrawer) {
      setDrawerOpen(true);
      setTimeout(() => setDrawerOpen(false), 3000);
    }

    setMovements((prev) => [data as CashMovement, ...prev]);
    return { error: null, drawerOpened: shouldOpenDrawer, requiresTerminal: config.requiresTerminal };
  };

  const registerMovement = async (
    type: MovementType,
    amount: number,
    description?: string
  ) => {
    if (!currentRegister) return { error: new Error("Nenhum caixa aberto") };

    const { data, error } = await supabase
      .from("cash_movements")
      .insert({
        cash_register_id: currentRegister.id,
        type,
        payment_method: "cash" as PaymentMethodType,
        amount,
        description,
        drawer_opened: true,
      })
      .select()
      .single();

    if (error) {
      return { error };
    }

    setDrawerOpen(true);
    setTimeout(() => setDrawerOpen(false), 3000);

    setMovements((prev) => [data as CashMovement, ...prev]);
    return { error: null };
  };

  // Calculate totals
  const totals = movements.reduce(
    (acc, m) => {
      const amount = Number(m.amount);

      if (m.type === "sale") {
        acc.totalSales += amount;
        acc.byMethod[m.payment_method as PaymentMethodType] =
          (acc.byMethod[m.payment_method as PaymentMethodType] || 0) + amount;
      } else if (m.type === "withdrawal") {
        acc.withdrawals += amount;
      } else if (m.type === "deposit") {
        acc.deposits += amount;
      }

      return acc;
    },
    {
      totalSales: 0,
      withdrawals: 0,
      deposits: 0,
      byMethod: {} as Record<PaymentMethodType, number>,
    }
  );

  const cashInDrawer = currentRegister
    ? currentRegister.opening_balance +
      (totals.byMethod.cash || 0) +
      totals.deposits -
      totals.withdrawals
    : 0;

  return {
    currentRegister,
    movements,
    loading,
    drawerOpen,
    totals,
    cashInDrawer,
    openRegister,
    closeRegister,
    registerPayment,
    registerMovement,
    refresh: fetchCurrentRegister,
  };
}
