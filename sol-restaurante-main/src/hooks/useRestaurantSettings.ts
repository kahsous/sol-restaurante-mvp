import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RestaurantSettings {
  id: string;
  name: string;
  slogan: string | null;
  phone: string | null;
  whatsapp: string | null;
  address_street: string | null;
  address_full: string | null;
  city: string | null;
  state: string | null;
  maps_url: string | null;
  instagram_url: string | null;
  working_hours: string | null;
  delivery_time: string | null;
  primary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  hero_url: string | null;
  footer_text: string | null;
  pix_key: string | null;
}

const DEFAULTS: RestaurantSettings = {
  id: "",
  name: "Restaurante Sol",
  slogan: "Comida caseira no fogão a lenha",
  phone: "(13) 98115-9622",
  whatsapp: "5513981159622",
  address_street: "Av. Santos Dumont, 952",
  address_full: "Av. Santos Dumont, 952 - Sítio Paecara (Vicente de Carvalho), Guarujá - SP, 11460-002",
  city: "Guarujá",
  state: "SP",
  maps_url: "https://maps.google.com/?q=Av.+Santos+Dumont,+952+-+Sítio+Paecara,+Guarujá+-+SP",
  instagram_url: "https://www.instagram.com/restauranteconfeitariasol",
  working_hours: "Segunda a Sexta: 11:00 às 15:30",
  delivery_time: "30-45 min",
  primary_color: null,
  accent_color: null,
  logo_url: null,
  hero_url: null,
  footer_text: null,
  pix_key: null,
};

export function useRestaurantSettings() {
  const [settings, setSettings] = useState<RestaurantSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("restaurant_settings")
      .select("*")
      .limit(1)
      .single();

    if (!error && data) {
      setSettings(data as unknown as RestaurantSettings);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (updates: Partial<RestaurantSettings>) => {
    const { error } = await supabase
      .from("restaurant_settings")
      .update(updates as any)
      .eq("id", settings.id);

    if (!error) {
      setSettings((prev) => ({ ...prev, ...updates }));
    }
    return { error };
  };

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
