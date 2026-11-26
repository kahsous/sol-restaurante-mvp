import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("last_order_at", { ascending: false, nullsFirst: false });
    if (data) setCustomers(data as Customer[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const searchByPhone = useCallback(
    (phone: string) => {
      const clean = phone.replace(/\D/g, "");
      return customers.filter((c) => c.phone.replace(/\D/g, "").includes(clean));
    },
    [customers]
  );

  // Upsert customer from order data
  const upsertFromOrder = async (data: {
    name: string;
    phone: string;
    address_street?: string;
    address_number?: string;
    address_complement?: string;
    neighborhood?: string;
    order_total: number;
  }) => {
    const clean = data.phone.replace(/\D/g, "");
    const existing = customers.find((c) => c.phone.replace(/\D/g, "") === clean);

    if (existing) {
      const { error } = await supabase
        .from("customers")
        .update({
          name: data.name,
          total_orders: existing.total_orders + 1,
          total_spent: existing.total_spent + data.order_total,
          last_order_at: new Date().toISOString(),
          address_street: data.address_street || existing.address_street,
          address_number: data.address_number || existing.address_number,
          address_complement: data.address_complement || existing.address_complement,
          neighborhood: data.neighborhood || existing.neighborhood,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", existing.id);
      if (!error) await fetchCustomers();
      return { error };
    } else {
      const { error } = await supabase.from("customers").insert({
        name: data.name,
        phone: data.phone,
        total_orders: 1,
        total_spent: data.order_total,
        last_order_at: new Date().toISOString(),
        address_street: data.address_street || null,
        address_number: data.address_number || null,
        address_complement: data.address_complement || null,
        neighborhood: data.neighborhood || null,
      } as any);
      if (!error) await fetchCustomers();
      return { error };
    }
  };

  return { customers, loading, searchByPhone, upsertFromOrder, refresh: fetchCustomers };
}
