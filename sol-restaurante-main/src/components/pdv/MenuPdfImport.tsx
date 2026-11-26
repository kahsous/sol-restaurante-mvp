import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Loader2, CheckCircle2, PlusCircle, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildDiff, type DiffRow, type ExtractedItem } from "@/lib/menuDiff";
import type { Product, Category } from "@/types/product";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  categories: Category[];
  onApplied?: () => void;
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || "");
      const idx = s.indexOf("base64,");
      resolve(idx >= 0 ? s.slice(idx + 7) : s);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const money = (v?: number) => `R$ ${Number(v ?? 0).toFixed(2).replace(".", ",")}`;

const rowCategory = (r: DiffRow) =>
  r.extracted?.category ?? r.existing?.category?.name ?? "Sem categoria";

export function MenuPdfImport({ open, onOpenChange, products, categories, onApplied }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedItem[] | null>(null);
  const [rows, setRows] = useState<DiffRow[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const handleFile = async (file: File) => {
    setLoading(true);
    setExtracted(null);
    setRows([]);
    try {
      const b64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("parse-menu-pdf", {
        body: { pdfBase64: b64, filename: file.name },
      });
      if (error) throw error;
      const items: ExtractedItem[] = data?.items || [];
      const diff = buildDiff(items, products, categories);
      setExtracted(items);
      setRows(diff);
      const initSel: Record<number, boolean> = {};
      diff.forEach((r, i) => { if (r.status !== "unchanged") initSel[i] = true; });
      setSelected(initSel);
      toast({ title: "PDF processado", description: `${items.length} itens extraídos.` });
    } catch (e) {
      toast({ title: "Erro ao processar PDF", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const applyChanges = async () => {
    setApplying(true);
    let created = 0, updated = 0, deactivated = 0;
    try {
      for (let i = 0; i < rows.length; i++) {
        if (!selected[i]) continue;
        const r = rows[i];
        if (r.status === "create" && r.extracted) {
          const e = r.extracted;
          const { error } = await supabase.from("products").insert({
            name: e.name,
            description: e.description ?? null,
            category_id: r.matchedCategoryId ?? null,
            price_pequena: e.price_pequena ?? 0,
            price_media: e.price_media ?? 0,
            price_grande: e.price_grande ?? e.price_media ?? 0,
            is_active: true,
            availability: "both",
          });
          if (!error) created++;
        } else if (r.status === "update" && r.existing && r.extracted) {
          const e = r.extracted;
          const patch: Record<string, unknown> = {
            price_pequena: e.price_pequena ?? 0,
            price_media: e.price_media ?? 0,
            price_grande: e.price_grande ?? e.price_media ?? 0,
          };
          if (e.description) patch.description = e.description;
          if (r.matchedCategoryId) patch.category_id = r.matchedCategoryId;
          const { error } = await supabase.from("products").update(patch).eq("id", r.existing.id);
          if (!error) updated++;
        } else if (r.status === "deactivate" && r.existing) {
          const { error } = await supabase.from("products").update({ is_active: false }).eq("id", r.existing.id);
          if (!error) deactivated++;
        }
      }
      toast({
        title: "Cardápio atualizado",
        description: `${created} criado(s), ${updated} atualizado(s), ${deactivated} desativado(s).`,
      });
      onApplied?.();
      onOpenChange(false);
      setExtracted(null);
      setRows([]);
      setSelected({});
    } catch (e) {
      toast({ title: "Erro ao aplicar", description: String(e), variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const counts = rows.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  const changeableIdx = useMemo(
    () => rows.map((r, i) => ({ r, i })).filter((x) => x.r.status !== "unchanged").map((x) => x.i),
    [rows],
  );

  const categoryList = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r.status !== "unchanged") set.add(rowCategory(r)); });
    return Array.from(set).sort();
  }, [rows]);

  const selectedCount = changeableIdx.filter((i) => selected[i]).length;
  const allSelected = changeableIdx.length > 0 && selectedCount === changeableIdx.length;

  const setSelection = (indices: number[], value: boolean) => {
    setSelected((s) => {
      const next = { ...s };
      indices.forEach((i) => { next[i] = value; });
      return next;
    });
  };

  const selectAll = (value: boolean) => setSelection(changeableIdx, value);

  const selectOnlyStatus = (status: DiffRow["status"]) => {
    const next: Record<number, boolean> = {};
    rows.forEach((r, i) => { if (r.status === status) next[i] = true; });
    setSelected(next);
  };

  const selectByCategory = (cat: string) => {
    const next: Record<number, boolean> = {};
    rows.forEach((r, i) => {
      if (r.status !== "unchanged" && rowCategory(r) === cat) next[i] = true;
    });
    setSelected(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle>Importar cardápio por PDF</DialogTitle>
          <DialogDescription>
            Envie o PDF e reveja o que será criado, atualizado ou desativado. Só produtos ativos são comparados — nada é aplicado sem confirmação.
          </DialogDescription>
        </DialogHeader>

        {!extracted && (
          <div className="p-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Arraste o PDF do cardápio aqui ou selecione um arquivo.
              </p>
              <label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={loading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <Button asChild disabled={loading}>
                  <span>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {loading ? "Processando..." : "Selecionar PDF"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        )}

        {extracted && (
          <>
            {/* Toolbar: contagem + ações em lote */}
            <div className="px-6 py-3 border-b space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
                  <PlusCircle className="h-3 w-3" /> {counts.create || 0} novos
                </Badge>
                <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700">
                  <RefreshCw className="h-3 w-3" /> {counts.update || 0} alterados
                </Badge>
                <Badge variant="outline" className="gap-1 border-red-500 text-red-700">
                  <XCircle className="h-3 w-3" /> {counts.deactivate || 0} a desativar
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {counts.unchanged || 0} inalterados
                </Badge>
                <Badge variant="secondary" className="ml-auto">
                  {selectedCount} selecionado(s)
                </Badge>
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                <Button size="sm" variant="outline" onClick={() => selectAll(true)}>
                  Todos
                </Button>
                <Button size="sm" variant="outline" onClick={() => selectAll(false)}>
                  Nenhum
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500 text-green-700"
                  onClick={() => selectOnlyStatus("create")}
                >
                  Só novos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-yellow-500 text-yellow-700"
                  onClick={() => selectOnlyStatus("update")}
                >
                  Só alterados
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500 text-red-700"
                  onClick={() => selectOnlyStatus("deactivate")}
                >
                  Só desativar
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Select onValueChange={(v) => selectByCategory(v)}>
                  <SelectTrigger className="h-8 w-[220px]">
                    <SelectValue placeholder="Selecionar por categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryList.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabela rolável */}
            <div className="flex-1 min-h-0 overflow-hidden px-6 py-3">
              <ScrollArea className="h-full border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(v) => selectAll(!!v)}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead>Alterações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => {
                      const item = r.extracted || r.existing;
                      const bg =
                        r.status === "create" ? "bg-green-50 dark:bg-green-950/20"
                        : r.status === "update" ? "bg-yellow-50 dark:bg-yellow-950/20"
                        : r.status === "deactivate" ? "bg-red-50 dark:bg-red-950/20"
                        : "";
                      return (
                        <TableRow key={i} className={bg}>
                          <TableCell>
                            {r.status !== "unchanged" && (
                              <Checkbox
                                checked={!!selected[i]}
                                onCheckedChange={(v) => setSelected((s) => ({ ...s, [i]: !!v }))}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {r.status === "create" ? "novo" : r.status === "update" ? "atualizar" : r.status === "deactivate" ? "desativar" : "inalterado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{item && "name" in item ? item.name : ""}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {rowCategory(r)}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {r.extracted
                              ? `M ${money(r.extracted.price_media)} / G ${money(r.extracted.price_grande)}`
                              : r.existing
                              ? `M ${money(r.existing.price_media)} / G ${money(r.existing.price_grande)}`
                              : ""}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.changes?.join(", ")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Barra de ação (sempre visível) */}
            <div className="flex justify-end gap-2 px-6 py-3 border-t bg-background">
              <Button variant="outline" onClick={() => { setExtracted(null); setRows([]); setSelected({}); }}>
                Enviar outro PDF
              </Button>
              <Button onClick={applyChanges} disabled={applying || selectedCount === 0}>
                {applying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Aplicar {selectedCount > 0 ? `(${selectedCount})` : "alterações"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
