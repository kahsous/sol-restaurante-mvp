import { useEffect, useMemo, useState } from "react";
import { Layers, Save, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category } from "@/types/product";

interface BulkPriceEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  categories: Category[];
  onSaved?: () => void;
}

type PriceRow = {
  id: string;
  name: string;
  price_pequena: string;
  price_media: string;
  price_grande: string;
  original: { p: number; m: number; g: number };
};

const toNum = (v: string) => {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const fmt = (n: number) => n.toFixed(2);

export function BulkPriceEditor({
  open,
  onOpenChange,
  products,
  categories,
  onSaved,
}: BulkPriceEditorProps) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [bulkP, setBulkP] = useState("");
  const [bulkM, setBulkM] = useState("");
  const [bulkG, setBulkG] = useState("");
  const { toast } = useToast();

  // Default to first category with active products
  useEffect(() => {
    if (!open) return;
    if (categoryId) return;
    const first = categories.find((c) =>
      products.some((p) => p.category_id === c.id && p.is_active)
    );
    if (first) setCategoryId(first.id);
  }, [open, categories, products, categoryId]);

  // Load rows when category changes
  useEffect(() => {
    if (!categoryId) {
      setRows([]);
      return;
    }
    const filtered = products
      .filter((p) => p.category_id === categoryId && p.is_active && !p.sold_by_weight)
      .sort((a, b) => a.name.localeCompare(b.name));
    setRows(
      filtered.map((p) => ({
        id: p.id,
        name: p.name,
        price_pequena: fmt(p.price_pequena ?? 0),
        price_media: fmt(p.price_media ?? 0),
        price_grande: fmt(p.price_grande ?? 0),
        original: {
          p: p.price_pequena ?? 0,
          m: p.price_media ?? 0,
          g: p.price_grande ?? 0,
        },
      }))
    );
    setBulkP("");
    setBulkM("");
    setBulkG("");
  }, [categoryId, products]);

  const changedCount = useMemo(
    () =>
      rows.filter(
        (r) =>
          toNum(r.price_pequena) !== r.original.p ||
          toNum(r.price_media) !== r.original.m ||
          toNum(r.price_grande) !== r.original.g
      ).length,
    [rows]
  );

  const isChanged = (r: PriceRow) =>
    toNum(r.price_pequena) !== r.original.p ||
    toNum(r.price_media) !== r.original.m ||
    toNum(r.price_grande) !== r.original.g;

  const updateCell = (
    id: string,
    field: "price_pequena" | "price_media" | "price_grande",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const applyToAll = (field: "price_pequena" | "price_media" | "price_grande", value: string) => {
    if (!value.trim()) return;
    const normalized = fmt(toNum(value));
    setRows((prev) => prev.map((r) => ({ ...r, [field]: normalized })));
  };

  const applyPercent = (pct: number) => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        price_pequena: fmt(toNum(r.price_pequena) * (1 + pct / 100)),
        price_media: fmt(toNum(r.price_media) * (1 + pct / 100)),
        price_grande: fmt(toNum(r.price_grande) * (1 + pct / 100)),
      }))
    );
  };

  const resetRow = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              price_pequena: fmt(r.original.p),
              price_media: fmt(r.original.m),
              price_grande: fmt(r.original.g),
            }
          : r
      )
    );
  };

  const handleSave = async () => {
    const changes = rows.filter(isChanged);
    if (changes.length === 0) {
      toast({ title: "Nada para salvar", description: "Nenhum preço foi alterado." });
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.all(
        changes.map((r) =>
          supabase
            .from("products")
            .update({
              price_pequena: toNum(r.price_pequena),
              price_media: toNum(r.price_media),
              price_grande: toNum(r.price_grande),
            })
            .eq("id", r.id)
        )
      );
      const failed = results.filter((r) => r.error);
      if (failed.length > 0) {
        toast({
          title: "Alguns preços não foram salvos",
          description: `${failed.length} de ${changes.length} falharam. ${failed[0].error?.message ?? ""}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Preços atualizados",
          description: `${changes.length} produto(s) atualizado(s).`,
        });
        onSaved?.();
        onOpenChange(false);
      }
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const availableCategories = categories.filter((c) =>
    products.some((p) => p.category_id === c.id && p.is_active && !p.sold_by_weight)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Editar preços em massa
          </DialogTitle>
          <DialogDescription>
            Selecione uma categoria e edite os preços P, M e G de todos os produtos ativos de uma vez.
            Zero significa "tamanho não disponível".
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 overflow-hidden">
          {/* Category selector + percent actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {rows.length > 0 && (
              <div className="flex gap-1 ml-auto">
                <Button variant="outline" size="sm" onClick={() => applyPercent(-10)}>
                  -10%
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPercent(10)}>
                  +10%
                </Button>
              </div>
            )}
          </div>

          {/* Table */}
          {rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {categoryId
                ? "Nenhum produto ativo nesta categoria."
                : "Selecione uma categoria para começar."}
            </div>
          ) : (
            <div className="flex-1 overflow-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="min-w-[200px]">Produto</TableHead>
                    <TableHead>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold">Preço P</div>
                        <div className="flex gap-1">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Aplicar"
                            value={bulkP}
                            onChange={(e) => setBulkP(e.target.value)}
                            className="h-7 text-xs w-20"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2 text-xs"
                            onClick={() => applyToAll("price_pequena", bulkP)}
                          >
                            OK
                          </Button>
                        </div>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold">Preço M</div>
                        <div className="flex gap-1">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Aplicar"
                            value={bulkM}
                            onChange={(e) => setBulkM(e.target.value)}
                            className="h-7 text-xs w-20"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2 text-xs"
                            onClick={() => applyToAll("price_media", bulkM)}
                          >
                            OK
                          </Button>
                        </div>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold">Preço G</div>
                        <div className="flex gap-1">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Aplicar"
                            value={bulkG}
                            onChange={(e) => setBulkG(e.target.value)}
                            className="h-7 text-xs w-20"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2 text-xs"
                            onClick={() => applyToAll("price_grande", bulkG)}
                          >
                            OK
                          </Button>
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const changed = isChanged(r);
                    return (
                      <TableRow key={r.id} className={changed ? "bg-primary/5" : ""}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={r.price_pequena}
                            onChange={(e) => updateCell(r.id, "price_pequena", e.target.value)}
                            className="h-8 w-24 font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={r.price_media}
                            onChange={(e) => updateCell(r.id, "price_media", e.target.value)}
                            className="h-8 w-24 font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={r.price_grande}
                            onChange={(e) => updateCell(r.id, "price_grande", e.target.value)}
                            className="h-8 w-24 font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          {changed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => resetRow(r.id)}
                              title="Desfazer alterações desta linha"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {changedCount > 0
              ? `${changedCount} produto(s) alterado(s)`
              : "Nenhuma alteração"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || changedCount === 0}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
