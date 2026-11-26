import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PublicTenant {
  id: string;
  slug: string;
  name: string;
  business_type: string;
  logo_url: string | null;
  primary_color: string | null;
}

const STORAGE_KEY = "selected_tenant_slug";

/**
 * Public/guest site tenant resolver.
 * - If URL param ?t=<slug> is present, use it.
 * - Else if localStorage has a saved slug, use it.
 * - Else if there is exactly one active tenant, auto-select it.
 * - Else the caller should render a picker (tenants list is returned).
 */
export function usePublicTenant() {
  const [tenant, setTenant] = useState<PublicTenant | null>(null);
  const [tenants, setTenants] = useState<PublicTenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("public_tenants" as any)
        .select("id, slug, name, business_type, logo_url, primary_color");
      if (cancelled) return;
      const list = ((data as unknown) as PublicTenant[]) || [];
      setTenants(list);

      const params = new URLSearchParams(window.location.search);
      const urlSlug = params.get("t");
      const stored = localStorage.getItem(STORAGE_KEY);
      const picked =
        (urlSlug && list.find((t) => t.slug === urlSlug)) ||
        (stored && list.find((t) => t.slug === stored)) ||
        (list.length === 1 ? list[0] : null);

      if (picked) {
        setTenant(picked);
        localStorage.setItem(STORAGE_KEY, picked.slug);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectTenant = (slug: string) => {
    const found = tenants.find((t) => t.slug === slug);
    if (found) {
      setTenant(found);
      localStorage.setItem(STORAGE_KEY, slug);
    }
  };

  return { tenant, tenants, loading, selectTenant };
}
