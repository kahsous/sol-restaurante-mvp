import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface ClosedDate {
  id: string;
  date_start: string;
  date_end: string;
  reason: string;
  created_at: string;
}

export function useClosedDates() {
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("closed_dates")
      .select("*")
      .order("date_start", { ascending: true });
    setClosedDates((data as ClosedDate[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addClosedDate = async (dateStart: Date, dateEnd: Date, reason: string) => {
    const { error } = await supabase.from("closed_dates").insert({
      date_start: format(dateStart, "yyyy-MM-dd"),
      date_end: format(dateEnd, "yyyy-MM-dd"),
      reason: reason || "Fechado",
    });
    if (!error) await fetch();
    return { error };
  };

  const removeClosedDate = async (id: string) => {
    const { error } = await supabase.from("closed_dates").delete().eq("id", id);
    if (!error) await fetch();
    return { error };
  };

  return { closedDates, loading, addClosedDate, removeClosedDate, refresh: fetch };
}

/** Check if today is a closed date (for site use) */
export async function isTodayClosed(): Promise<boolean> {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data } = await supabase
    .from("closed_dates")
    .select("id")
    .lte("date_start", today)
    .gte("date_end", today)
    .limit(1);
  return (data && data.length > 0) || false;
}
