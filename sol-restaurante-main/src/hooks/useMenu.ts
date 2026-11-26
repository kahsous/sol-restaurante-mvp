import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MenuItem, Category, ItemSize, OptionGroup } from "@/types/menu";
import { getRestaurantLocalDate, getRestaurantLocalMinutes, productMatchesRestaurantDay } from "@/lib/restaurantDate";

const PRATOS_SEMANA_CAT = "11111111-0001-0001-0001-000000000001";
const BUFFET_CAT = "11111111-0001-0001-0001-000000000008";
const COMIDA_KILO_CAT = "11111111-0001-0001-0001-000000000009";
export const DESTAQUES_CAT = "11111111-0001-0001-0001-000000000099";

const stripPricesFromDescription = (desc: string): string =>
  desc.replace(/\s*\|\s*[PMG]\s*R\$[\d,.]+/gi, "").replace(/\s*\|\s*$/, "").trim();

interface DbOption {
  id: string;
  name: string;
  price_delta: number;
  is_active: boolean;
  display_order: number;
}

interface DbOptionGroup {
  id: string;
  name: string;
  required: boolean;
  min_select: number;
  max_select: number;
  display_order: number;
  options: DbOption[];
}

interface DbProduct {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_pequena: number;
  price_media: number;
  price_grande: number;
  is_active: boolean;
  is_featured: boolean;
  track_stock: boolean;
  stock_quantity: number | null;
  availability: string;
  availability_pequena: string;
  availability_media: string;
  availability_grande: string;
  sale_start: string | null;
  sale_end: string | null;
  is_combo?: boolean;
  category?: { id: string; name: string; icon: string } | null;
  option_groups?: DbOptionGroup[];
}

const isWithinSaleHours = (start: string | null, end: string | null): boolean => {
  if (!start || !end) return true;
  const cur = getRestaurantLocalMinutes();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return s <= e ? cur >= s && cur <= e : cur >= s || cur <= e;
};

interface DbCategory {
  id: string;
  name: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

const mapOptionGroups = (groups: DbOptionGroup[] | undefined): OptionGroup[] => {
  if (!groups) return [];
  return [...groups]
    .sort((a, b) => a.display_order - b.display_order)
    .map((g) => ({
      id: g.id,
      name: g.name,
      required: g.required,
      minSelect: g.min_select,
      maxSelect: g.max_select,
      displayOrder: g.display_order,
      options: (g.options || [])
        .filter((o) => o.is_active)
        .sort((a, b) => a.display_order - b.display_order)
        .map((o) => ({
          id: o.id,
          name: o.name,
          priceDelta: Number(o.price_delta),
          isActive: o.is_active,
        })),
    }));
};

export function useMenu(channel: "delivery" | "restaurant" = "delivery") {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClosedDate, setIsClosedDate] = useState(false);

  const fetchMenu = useCallback(async () => {
    setLoading(true);

    const [categoriesResult, productsResult] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order"),
      supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name, icon),
          option_groups(*, options(*))
        `)
        .eq("is_active", true)
        .order("display_order"),
    ]);

    const dbCategories = !categoriesResult.error
      ? (categoriesResult.data as DbCategory[])
      : [];

    if (!productsResult.error) {
      const dbProducts = productsResult.data as DbProduct[];
      const items: MenuItem[] = [];

      for (const product of dbProducts) {
        if (product.category_id === BUFFET_CAT || product.category_id === COMIDA_KILO_CAT) continue;
        if (!isWithinSaleHours(product.sale_start, product.sale_end)) continue;
        if (product.category_id === PRATOS_SEMANA_CAT) {
          if (!productMatchesRestaurantDay(product.description)) continue;
        }

        const availableSizes: ItemSize[] = [];
        const ap = product.availability_pequena || "both";
        const am = product.availability_media || "both";
        const ag = product.availability_grande || "both";

        if (product.price_pequena > 0 && (ap === channel || ap === "both")) availableSizes.push("pequena");
        if (product.price_media > 0 && (am === channel || am === "both")) availableSizes.push("media");
        if (product.price_grande > 0 && (ag === channel || ag === "both")) availableSizes.push("grande");
        if (availableSizes.length === 0) continue;

        const availablePrices = availableSizes.map((s) =>
          s === "pequena" ? product.price_pequena : s === "media" ? product.price_media : product.price_grande,
        );
        const allSamePrice = availablePrices.every((p) => p === availablePrices[0]);
        const finalSizes = allSamePrice ? [availableSizes[0]] : availableSizes;

        const globalAvail = product.availability || "both";
        if (globalAvail !== "both" && globalAvail !== channel) continue;

        items.push({
          id: product.id,
          name: product.name,
          description: stripPricesFromDescription(product.description || ""),
          pricePequena: Number(product.price_pequena),
          priceMedia: Number(product.price_media),
          priceGrande: Number(product.price_grande),
          category: product.category_id || "",
          categoryName: product.category?.name,
          categoryIcon: product.category?.icon,
          isFeatured: product.is_featured,
          trackStock: product.track_stock,
          stockQuantity: product.stock_quantity,
          availableSizes: finalSizes,
          optionGroups: mapOptionGroups(product.option_groups),
        });
      }

      setMenuItems(items);

      const visibleCategoryIds = new Set(items.map((item) => item.category));
      const hasFeatured = items.some((i) => i.isFeatured);

      const visibleCats = dbCategories
        .filter((cat) => visibleCategoryIds.has(cat.id) && cat.id !== DESTAQUES_CAT)
        .map((cat) => ({ id: cat.id, name: cat.name, icon: cat.icon }));

      // Prepend Destaques if there are featured items
      if (hasFeatured) {
        const featuredCat = dbCategories.find((c) => c.id === DESTAQUES_CAT);
        if (featuredCat) {
          visibleCats.unshift({ id: featuredCat.id, name: featuredCat.name, icon: featuredCat.icon });
        }
      }

      setCategories(visibleCats);
    }

    setLoading(false);
  }, [channel]);

  useEffect(() => {
    const init = async () => {
      const today = getRestaurantLocalDate();
      const { data: closedData } = await supabase
        .from("closed_dates")
        .select("id")
        .lte("date_start", today)
        .gte("date_end", today)
        .limit(1);

      const closedToday = (closedData && closedData.length > 0) || false;
      setIsClosedDate(closedToday);

      if (closedToday) {
        setLoading(false);
        return;
      }
      fetchMenu();
    };

    init();


    const productsChannel = supabase
      .channel("public-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchMenu())
      .subscribe();
    const categoriesChannel = supabase
      .channel("public-categories")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => fetchMenu())
      .subscribe();
    const optionsChannel = supabase
      .channel("public-option-groups")
      .on("postgres_changes", { event: "*", schema: "public", table: "option_groups" }, () => fetchMenu())
      .on("postgres_changes", { event: "*", schema: "public", table: "options" }, () => fetchMenu())
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(optionsChannel);
    };
  }, [fetchMenu]);

  return {
    menuItems,
    categories,
    loading,
    refresh: fetchMenu,
    isClosed: isClosedDate,
  };
}
