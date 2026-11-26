import type { Product, Category } from "@/types/product";

export interface ExtractedItem {
  name: string;
  description?: string;
  category?: string;
  price_pequena?: number;
  price_media?: number;
  price_grande?: number;
}

export type DiffStatus = "create" | "update" | "deactivate" | "unchanged";

export interface DiffRow {
  status: DiffStatus;
  extracted?: ExtractedItem;
  existing?: Product;
  matchedCategoryId?: string;
  changes?: string[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const num = (v: number | undefined) => Number(v ?? 0);

export function buildDiff(
  extracted: ExtractedItem[],
  products: Product[],
  categories: Category[],
): DiffRow[] {
  const catByName = new Map<string, string>();
  for (const c of categories) catByName.set(norm(c.name), c.id);

  const activeProducts = products.filter((p) => p.is_active);
  const usedProductIds = new Set<string>();
  const rows: DiffRow[] = [];

  for (const item of extracted) {
    const targetCatId = item.category ? catByName.get(norm(item.category)) : undefined;
    const nameKey = norm(item.name);

    const match = activeProducts.find(
      (p) => norm(p.name) === nameKey && (!targetCatId || p.category_id === targetCatId),
    ) ||
      activeProducts.find((p) => norm(p.name) === nameKey);

    if (!match) {
      rows.push({ status: "create", extracted: item, matchedCategoryId: targetCatId });
      continue;
    }

    usedProductIds.add(match.id);
    const changes: string[] = [];
    if (num(match.price_pequena) !== num(item.price_pequena)) {
      changes.push(`P: ${match.price_pequena} → ${item.price_pequena ?? 0}`);
    }
    if (num(match.price_media) !== num(item.price_media)) {
      changes.push(`M: ${match.price_media} → ${item.price_media ?? 0}`);
    }
    if (num(match.price_grande) !== num(item.price_grande)) {
      changes.push(`G: ${match.price_grande} → ${item.price_grande ?? 0}`);
    }
    if (
      item.description &&
      (match.description || "").trim() !== item.description.trim()
    ) {
      changes.push("descrição");
    }
    if (targetCatId && match.category_id !== targetCatId) {
      changes.push("categoria");
    }

    rows.push({
      status: changes.length ? "update" : "unchanged",
      extracted: item,
      existing: match,
      matchedCategoryId: targetCatId,
      changes,
    });
  }

  for (const p of activeProducts) {
    if (usedProductIds.has(p.id)) continue;
    rows.push({ status: "deactivate", existing: p });
  }

  return rows;
}
