import { useState, useRef } from "react";
import { Upload, FileText, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Ingredient } from "@/hooks/useIngredients";

const VALID_UNITS = ["kg", "g", "ml", "l", "unidade", "pacote", "maço", "caixa", "un", "1kg", "5kg", "litro"];

interface ParsedRow {
  name: string;
  price: number;
  unit: string;
  valid: boolean;
  error?: string;
}

interface MatchedRow extends ParsedRow {
  action: "update" | "create";
  existingId?: string;
  existingPrice?: number;
  existingUnit?: string;
}

interface UploadResult {
  updated: number;
  created: number;
  errors: string[];
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  const rows: ParsedRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip header
    if (i === 0 && /produto/i.test(line) && /pre[çc]o/i.test(line)) continue;

    const parts = line.split(",").map((s) => s.trim());
    if (parts.length < 3) {
      rows.push({ name: line, price: 0, unit: "", valid: false, error: "Formato inválido - esperado: Produto,Preço,Unidade" });
      continue;
    }

    const name = parts[0];
    const priceStr = parts[1];
    const unit = parts[parts.length - 1]; // last field is unit
    
    // Price might span multiple comma-separated parts (e.g. "47,90" split into "47" and "90")
    let price: number;
    if (parts.length === 4) {
      // e.g. "Contra filé,47,90,kg" — price is parts[1]+"."+parts[2]
      price = parseFloat(parts[1] + "." + parts[2]);
    } else {
      price = parseFloat(priceStr.replace(",", "."));
    }

    if (!name) {
      rows.push({ name: "", price: 0, unit: "", valid: false, error: "Nome do produto vazio" });
      continue;
    }
    if (isNaN(price) || price <= 0) {
      rows.push({ name, price: 0, unit, valid: false, error: `Preço inválido: "${priceStr}"` });
      continue;
    }
    if (!unit || !VALID_UNITS.includes(unit.toLowerCase())) {
      rows.push({ name, price, unit, valid: false, error: `Unidade inválida: "${unit}"` });
      continue;
    }

    rows.push({ name, price, unit: unit.toLowerCase(), valid: true });
  }

  return rows;
}

function matchWithExisting(parsed: ParsedRow[], ingredients: Ingredient[]): MatchedRow[] {
  return parsed.map((row) => {
    if (!row.valid) return { ...row, action: "create" as const };

    const normalizedName = row.name.toLowerCase().trim();
    const existing = ingredients.find(
      (ing) => ing.name.toLowerCase().trim() === normalizedName
    );

    if (existing) {
      return {
        ...row,
        action: "update" as const,
        existingId: existing.id,
        existingPrice: existing.cost_per_unit,
        existingUnit: existing.unit,
      };
    }

    return { ...row, action: "create" as const };
  });
}

interface IngredientBulkUploadProps {
  ingredients: Ingredient[];
  onComplete: () => void;
}

export function IngredientBulkUpload({ ingredients, onComplete }: IngredientBulkUploadProps) {
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [matchedRows, setMatchedRows] = useState<MatchedRow[]>([]);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const reset = () => {
    setMatchedRows([]);
    setResult(null);
    setFileName("");
    setParsing(false);
    setApplying(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);
    setParsing(true);

    try {
      if (file.name.toLowerCase().endsWith(".csv") || file.name.toLowerCase().endsWith(".txt")) {
        const text = await file.text();
        const parsed = parseCSV(text);
        setMatchedRows(matchWithExisting(parsed, ingredients));
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        // Use edge function for PDF parsing
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          const { data, error } = await supabase.functions.invoke("parse-ingredient-pdf", {
            body: { fileBase64: base64, fileName: file.name },
          });

          if (error || !data?.rows) {
            toast({
              title: "Erro ao processar PDF",
              description: error?.message || "Não foi possível extrair dados do PDF",
              variant: "destructive",
            });
            setParsing(false);
            return;
          }

          const parsed: ParsedRow[] = data.rows.map((r: any) => {
            const price = parseFloat(String(r.price).replace(",", ".")) || 0;
            const unit = String(r.unit || "").toLowerCase();
            const name = String(r.name || "").trim();

            if (!name) return { name: "", price: 0, unit: "", valid: false, error: "Nome vazio" };
            if (price <= 0) return { name, price: 0, unit, valid: false, error: "Preço inválido" };
            if (!VALID_UNITS.includes(unit)) return { name, price, unit, valid: false, error: `Unidade inválida: "${unit}"` };

            return { name, price, unit, valid: true };
          });

          setMatchedRows(matchWithExisting(parsed, ingredients));
          setParsing(false);
        };
        reader.readAsDataURL(file);
        return;
      } else {
        toast({
          title: "Formato não suportado",
          description: "Envie um arquivo CSV ou PDF",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Erro ao ler arquivo", description: err.message, variant: "destructive" });
    }

    setParsing(false);
  };

  const validRows = matchedRows.filter((r) => r.valid);
  const invalidRows = matchedRows.filter((r) => !r.valid);
  const toUpdate = validRows.filter((r) => r.action === "update");
  const toCreate = validRows.filter((r) => r.action === "create");

  const handleApply = async () => {
    setApplying(true);
    const errors: string[] = [];
    let updated = 0;
    let created = 0;

    // Batch updates
    for (const row of toUpdate) {
      const { error } = await supabase
        .from("ingredients")
        .update({ cost_per_unit: row.price, unit: row.unit } as any)
        .eq("id", row.existingId!);

      if (error) {
        errors.push(`Erro ao atualizar "${row.name}": ${error.message}`);
      } else {
        updated++;
      }
    }

    // Batch creates
    for (const row of toCreate) {
      const { error } = await supabase
        .from("ingredients")
        .insert({ name: row.name, cost_per_unit: row.price, unit: row.unit, stock_quantity: 0, min_stock: 0 } as any);

      if (error) {
        errors.push(`Erro ao criar "${row.name}": ${error.message}`);
      } else {
        created++;
      }
    }

    setResult({ updated, created, errors });
    setApplying(false);
    onComplete();

    toast({
      title: "Importação concluída",
      description: `${updated} atualizados, ${created} criados${errors.length > 0 ? `, ${errors.length} erros` : ""}`,
    });
  };

  return (
    <>
      <Button variant="outline" onClick={() => { reset(); setOpen(true); }}>
        <Upload className="h-4 w-4 mr-1" />
        Importar CSV/PDF
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Importar Insumos via Arquivo
            </DialogTitle>
            <DialogDescription>
              Envie um CSV ou PDF com colunas: Produto, Preço, Unidade
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* File Input */}
            {!result && (
              <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar ou arraste um arquivo CSV/PDF
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,.pdf"
                  onChange={handleFile}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={parsing}>
                  {parsing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Selecionar Arquivo"
                  )}
                </Button>
                {fileName && (
                  <p className="text-xs text-muted-foreground">📄 {fileName}</p>
                )}
              </div>
            )}

            {/* Preview Table */}
            {matchedRows.length > 0 && !result && (
              <>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="default" className="bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    {toUpdate.length} atualizar
                  </Badge>
                  <Badge variant="default" className="bg-blue-600">
                    <Check className="h-3 w-3 mr-1" />
                    {toCreate.length} criar
                  </Badge>
                  {invalidRows.length > 0 && (
                    <Badge variant="destructive">
                      <X className="h-3 w-3 mr-1" />
                      {invalidRows.length} erros
                    </Badge>
                  )}
                </div>

                <ScrollArea className="max-h-[350px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Preço Novo</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Detalhe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matchedRows.map((row, i) => (
                        <TableRow
                          key={i}
                          className={!row.valid ? "bg-destructive/5" : row.action === "create" ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}
                        >
                          <TableCell className="font-medium">{row.name || "—"}</TableCell>
                          <TableCell className="text-right font-mono">
                            {row.valid ? fmt(row.price) : "—"}
                          </TableCell>
                          <TableCell>{row.unit || "—"}</TableCell>
                          <TableCell>
                            {!row.valid ? (
                              <Badge variant="destructive" className="text-xs">
                                <X className="h-3 w-3 mr-0.5" />
                                Erro
                              </Badge>
                            ) : row.action === "update" ? (
                              <Badge className="bg-green-600 text-xs">Atualizar</Badge>
                            ) : (
                              <Badge className="bg-blue-600 text-xs">Criar</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {!row.valid
                              ? row.error
                              : row.action === "update"
                                ? `Preço atual: ${fmt(row.existingPrice ?? 0)} → ${fmt(row.price)}`
                                : "Novo insumo"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </>
            )}

            {/* Result Summary */}
            {result && (
              <div className="space-y-4">
                <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Check className="h-5 w-5" />
                      Importação Concluída
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">✅ <strong>{result.updated}</strong> insumos atualizados</p>
                    <p className="text-sm">🆕 <strong>{result.created}</strong> insumos criados</p>
                    {result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-destructive font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          {result.errors.length} erros:
                        </p>
                        <ul className="text-xs text-destructive mt-1 space-y-0.5">
                          {result.errors.map((err, i) => (
                            <li key={i}>• {err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {result ? (
              <Button onClick={() => { reset(); setOpen(false); }}>Fechar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>
                  Cancelar
                </Button>
                {validRows.length > 0 && (
                  <Button onClick={handleApply} disabled={applying}>
                    {applying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      `Aplicar (${validRows.length} itens)`
                    )}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
