import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2 } from "lucide-react";
import {
  exportMenuToPdf,
  type MenuItem,
  type RestaurantInfo,
} from "@/lib/menuPdfExport";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price_pequena: number | null;
  price_media: number | null;
  price_grande: number | null;
  availability_pequena: string | null;
  availability_media: string | null;
  availability_grande: string | null;
  is_active: boolean;
  is_combo: boolean | null;
  serves: number | null;
  sale_start: string | null;
  sale_end: string | null;
  combo_items: Array<{ product_id: string; quantity: number }> | null;
  display_order: number | null;
  categories: {
    name: string;
    display_order: number | null;
    is_active: boolean;
  } | null;
  option_groups: Array<{
    name: string;
    required: boolean;
    min_select: number;
    max_select: number;
    display_order: number | null;
    options: Array<{
      name: string;
      price_delta: number;
      is_active: boolean;
      display_order: number | null;
    }>;
  }>;
};

const DELIVERY_OK = new Set(["both", "delivery"]);
const visibleForDelivery = (avail: string | null) =>
  !avail || DELIVERY_OK.has(avail);

const brl = (v: number | null | undefined) =>
  v == null || v === 0
    ? null
    : `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

export default function Cardapio99Food() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantInfo>({
    name: "Restaurante",
  });

  useEffect(() => {
    document.title = "Cardápio Oficial — 99food";
    (async () => {
      const [prodRes, settingsRes] = await Promise.all([
        supabase
          .from("products")
          .select(
            `id,name,description,price_pequena,price_media,price_grande,
             availability_pequena,availability_media,availability_grande,
             is_active,is_combo,serves,sale_start,sale_end,combo_items,display_order,
             categories:category_id(name,display_order,is_active),
             option_groups(name,required,min_select,max_select,display_order,
               options(name,price_delta,is_active,display_order))`,
          )
          .eq("is_active", true),
        supabase
          .from("restaurant_settings")
          .select("name,phone,whatsapp,address_full,working_hours")
          .limit(1)
          .maybeSingle(),
      ]);

      if (settingsRes.data) setRestaurant(settingsRes.data as RestaurantInfo);
      if (prodRes.data) setProducts(prodRes.data as unknown as ProductRow[]);
      setLoading(false);
    })();
  }, []);

  type EnrichedItem = MenuItem & {
    id: string;
    is_combo: boolean;
    serves: number | null;
    sale_start: string | null;
    sale_end: string | null;
    combo_items: Array<{ product_id: string; quantity: number }>;
    option_groups_full?: Array<{
      name: string;
      required: boolean;
      min_select: number;
      max_select: number;
      options: Array<{ name: string; price_delta: number }>;
    }>;
  };

  const grouped = useMemo(() => {
    const items: EnrichedItem[] = [];
    const productNameById = new Map(products.map((p) => [p.id, p.name] as const));
    for (const p of products) {
      if (!p.categories?.is_active) continue;
      const sizes = {
        p:
          visibleForDelivery(p.availability_pequena) && p.price_pequena
            ? p.price_pequena
            : null,
        m:
          visibleForDelivery(p.availability_media) && p.price_media
            ? p.price_media
            : null,
        g:
          visibleForDelivery(p.availability_grande) && p.price_grande
            ? p.price_grande
            : null,
      };
      if (!sizes.p && !sizes.m && !sizes.g) continue;
      const sortedGroups = (p.option_groups ?? [])
        .slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      items.push({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.categories.name,
        price_pequena: sizes.p,
        price_media: sizes.m,
        price_grande: sizes.g,
        is_combo: !!p.is_combo,
        serves: p.serves,
        sale_start: p.sale_start,
        sale_end: p.sale_end,
        combo_items: Array.isArray(p.combo_items) ? p.combo_items : [],
        option_groups: sortedGroups.map((g) => ({
          name: g.name,
          required: g.required,
          options: g.options
            .filter((o) => o.is_active)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((o) => ({ name: o.name, price_delta: Number(o.price_delta) || 0 })),
        })),
        option_groups_full: sortedGroups.map((g) => ({
          name: g.name,
          required: g.required,
          min_select: g.min_select,
          max_select: g.max_select,
          options: g.options
            .filter((o) => o.is_active)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((o) => ({ name: o.name, price_delta: Number(o.price_delta) || 0 })),
        })),
      });
    }
    const catOrder = new Map<string, number>();
    for (const p of products) {
      if (p.categories)
        catOrder.set(p.categories.name, p.categories.display_order ?? 0);
    }
    items.sort((a, b) => {
      // Combos always first inside a category
      if (a.category === b.category) {
        if (a.is_combo !== b.is_combo) return a.is_combo ? -1 : 1;
        return a.name.localeCompare(b.name, "pt-BR");
      }
      return (catOrder.get(a.category) ?? 0) - (catOrder.get(b.category) ?? 0);
    });

    const byCat = new Map<string, EnrichedItem[]>();
    for (const it of items) {
      const l = byCat.get(it.category) ?? [];
      l.push(it);
      byCat.set(it.category, l);
    }
    return { items, byCat, productNameById };
  }, [products]);

  const handleDownload = () => {
    exportMenuToPdf(grouped.items, restaurant);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10 print:px-0 print:py-4">
        <header className="mb-8 print:mb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Cardápio oficial · para importação 99food
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold">
            {restaurant.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atualizado em {new Date().toLocaleDateString("pt-BR")}
            {restaurant.working_hours ? ` · ${restaurant.working_hours}` : ""}
          </p>
          {(restaurant.address_full ||
            restaurant.phone ||
            restaurant.whatsapp) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {[
                restaurant.address_full,
                restaurant.phone && `Tel ${restaurant.phone}`,
                restaurant.whatsapp &&
                  restaurant.whatsapp !== restaurant.phone &&
                  `WhatsApp ${restaurant.whatsapp}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <div className="mt-5 flex gap-2 print:hidden">
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </header>

        {grouped.byCat.size === 0 && (
          <p className="text-muted-foreground">
            Nenhum item disponível para delivery no momento.
          </p>
        )}

        {[...grouped.byCat.entries()].map(([cat, items]) => (
          <section key={cat} className="mb-10" data-category={cat}>
            <h2 className="mb-3 border-b pb-2 font-display text-2xl font-semibold uppercase tracking-wide text-primary">
              {cat}
            </h2>
            <ul className="divide-y">
              {items.map((it) => (
                <li key={`${cat}-${it.id}`} className="py-4">
                  <article data-product-id={it.id} data-is-combo={it.is_combo ? "true" : "false"}>
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        {it.is_combo && (
                          <span className="inline-block rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Combo
                          </span>
                        )}
                        {it.name}
                      </h3>
                      <div className="flex shrink-0 gap-3 text-sm tabular-nums">
                        {brl(it.price_pequena) && (
                          <span>
                            <span className="text-muted-foreground">P </span>
                            <span data-price data-size="pequena">{brl(it.price_pequena)}</span>
                          </span>
                        )}
                        {brl(it.price_media) && (
                          <span>
                            <span className="text-muted-foreground">M </span>
                            <span data-price data-size="media">{brl(it.price_media)}</span>
                          </span>
                        )}
                        {brl(it.price_grande) && (
                          <span>
                            <span className="text-muted-foreground">G </span>
                            <span data-price data-size="grande">{brl(it.price_grande)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {it.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {it.description}
                      </p>
                    )}
                    {(it.sale_start || it.sale_end || it.serves) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {it.serves ? `Serve ${it.serves} ${it.serves === 1 ? "pessoa" : "pessoas"}` : ""}
                        {it.serves && (it.sale_start || it.sale_end) ? " · " : ""}
                        {it.sale_start && it.sale_end
                          ? `Venda das ${it.sale_start.slice(0, 5)} às ${it.sale_end.slice(0, 5)}`
                          : ""}
                      </p>
                    )}
                    {it.is_combo && it.combo_items.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">Composição:</span>{" "}
                        {it.combo_items
                          .map(
                            (c) =>
                              `${c.quantity}x ${grouped.productNameById.get(c.product_id) ?? "item"}`,
                          )
                          .join(" + ")}
                      </div>
                    )}
                    {it.option_groups_full && it.option_groups_full.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {it.option_groups_full.map((g) => (
                          <p
                            key={g.name}
                            className="text-xs text-muted-foreground"
                          >
                            <span className="font-medium">
                              {g.name}
                              {g.required ? " (obrigatório)" : " (opcional)"}
                              {` · min ${g.min_select} · max ${g.max_select}`}:
                            </span>{" "}
                            {g.options
                              .map(
                                (o) =>
                                  `${o.name}${
                                    o.price_delta
                                      ? ` (+R$ ${o.price_delta
                                          .toFixed(2)
                                          .replace(".", ",")})`
                                      : " (grátis)"
                                  }`,
                              )
                              .join(", ")}
                          </p>
                        ))}
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <footer className="mt-12 border-t pt-4 text-xs text-muted-foreground print:mt-4">
          Cardápio sujeito a alterações sem aviso prévio.
        </footer>
      </div>
    </div>
  );
}
