import { useState, useEffect } from "react";
import { Package, TrendingUp, TrendingDown, ArrowUpDown, AlertTriangle, Plus, History, Pencil, Trash2 } from "lucide-react";
import { IngredientBulkUpload } from "./IngredientBulkUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useStockMovements, type StockMovement } from "@/hooks/useStockMovements";
import type { Product } from "@/types/product";
import type { Ingredient } from "@/hooks/useIngredients";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const UNITS = ["g", "kg", "ml", "L", "un"];
const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface StockManagementProps {
  products: Product[];
  userId?: string;
  onRefreshProducts: () => void;
  ingredients: Ingredient[];
  onCreateIngredient: (data: Partial<Ingredient>) => Promise<{ error: any }>;
  onUpdateIngredient: (id: string, data: Partial<Ingredient>) => Promise<{ error: any }>;
  onDeleteIngredient: (id: string) => Promise<{ error: any }>;
  onRefreshIngredients: () => void;
}

export function StockManagement({
  products, userId, onRefreshProducts,
  ingredients, onCreateIngredient, onUpdateIngredient, onDeleteIngredient, onRefreshIngredients,
}: StockManagementProps) {
  const [entryProduct, setEntryProduct] = useState<Product | null>(null);
  const [entryQty, setEntryQty] = useState("");
  const [entryReason, setEntryReason] = useState("");
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const { movements, loading: movLoading, fetchMovements, registerEntry, registerAdjustment } = useStockMovements();

  // Ingredient form state
  const [ingDialogOpen, setIngDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingName, setIngName] = useState("");
  const [ingUnit, setIngUnit] = useState("kg");
  const [ingCost, setIngCost] = useState("");
  const [ingStock, setIngStock] = useState("");
  const [ingMinStock, setIngMinStock] = useState("");
  const [ingSearch, setIngSearch] = useState("");

  const stockProducts = products.filter((p) => p.track_stock);
  const lowStockProducts = stockProducts.filter((p) => (p.stock_quantity ?? 0) <= 5);
  const outOfStockProducts = stockProducts.filter((p) => (p.stock_quantity ?? 0) === 0);

  const lowIngredients = ingredients.filter((i) => i.stock_quantity <= i.min_stock);

  useEffect(() => {
    if (historyProduct) {
      fetchMovements(historyProduct.id);
    }
  }, [historyProduct, fetchMovements]);

  const handleEntry = async () => {
    if (!entryProduct || !entryQty) return;
    const qty = parseInt(entryQty);
    if (qty <= 0) return;

    const { error } = await registerEntry(
      entryProduct.id,
      qty,
      entryProduct.stock_quantity ?? 0,
      entryReason || undefined,
      userId
    );

    if (error) {
      toast({ title: "Erro ao registrar entrada", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Entrada registrada", description: `+${qty} un. de ${entryProduct.name}` });
      setEntryProduct(null);
      setEntryQty("");
      setEntryReason("");
      onRefreshProducts();
    }
  };

  const formatDate = (d: string) => format(new Date(d), "dd/MM HH:mm", { locale: ptBR });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "entry": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "exit": return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <ArrowUpDown className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "entry": return "Entrada";
      case "exit": return "Saída";
      default: return "Ajuste";
    }
  };

  // Ingredient handlers
  const openIngredientForm = (ingredient?: Ingredient) => {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setIngName(ingredient.name);
      setIngUnit(ingredient.unit);
      setIngCost(ingredient.cost_per_unit.toString().replace(".", ","));
      setIngStock(ingredient.stock_quantity.toString().replace(".", ","));
      setIngMinStock(ingredient.min_stock.toString().replace(".", ","));
    } else {
      setEditingIngredient(null);
      setIngName("");
      setIngUnit("kg");
      setIngCost("");
      setIngStock("");
      setIngMinStock("");
    }
    setIngDialogOpen(true);
  };

  const handleSaveIngredient = async () => {
    if (!ingName.trim()) return;
    const parseNum = (v: string) => parseFloat(v.replace(",", ".")) || 0;

    const data = {
      name: ingName.trim(),
      unit: ingUnit,
      cost_per_unit: parseNum(ingCost),
      stock_quantity: parseNum(ingStock),
      min_stock: parseNum(ingMinStock),
    };

    const { error } = editingIngredient
      ? await onUpdateIngredient(editingIngredient.id, data)
      : await onCreateIngredient(data);

    if (error) {
      toast({ title: "Erro ao salvar insumo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingIngredient ? "Insumo atualizado" : "Insumo cadastrado", description: ingName });
      setIngDialogOpen(false);
    }
  };

  const handleDeleteIngredient = async (ing: Ingredient) => {
    const { error } = await onDeleteIngredient(ing.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Insumo excluído", description: ing.name });
    }
  };

  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(ingSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ingredients">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ingredients">🥩 Insumos ({ingredients.length})</TabsTrigger>
          <TabsTrigger value="products">📦 Produtos ({stockProducts.length})</TabsTrigger>
        </TabsList>

        {/* ====== INSUMOS TAB ====== */}
        <TabsContent value="ingredients" className="space-y-4 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <Package className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                <div className="text-2xl font-bold">{ingredients.length}</div>
                <div className="text-xs text-muted-foreground">Total Insumos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto text-yellow-600 mb-1" />
                <div className="text-2xl font-bold text-yellow-600">{lowIngredients.length}</div>
                <div className="text-xs text-muted-foreground">Abaixo do Mínimo</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Package className="h-6 w-6 mx-auto text-destructive mb-1" />
                <div className="text-2xl font-bold text-destructive">
                  {ingredients.filter((i) => i.stock_quantity <= 0).length}
                </div>
                <div className="text-xs text-muted-foreground">Zerados</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto text-primary mb-1" />
                <div className="text-lg font-bold text-primary">
                  {fmt(ingredients.reduce((s, i) => s + i.stock_quantity * i.cost_per_unit, 0))}
                </div>
                <div className="text-xs text-muted-foreground">Valor em Estoque</div>
              </CardContent>
            </Card>
          </div>

          {/* Ingredient Level Panel */}
          {ingredients.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Nível dos Insumos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ingredients
                  .slice()
                  .sort((a, b) => {
                    const ratioA = a.min_stock > 0 ? a.stock_quantity / a.min_stock : a.stock_quantity > 0 ? 999 : 0;
                    const ratioB = b.min_stock > 0 ? b.stock_quantity / b.min_stock : b.stock_quantity > 0 ? 999 : 0;
                    return ratioA - ratioB;
                  })
                  .map((ing) => {
                    const maxDisplay = Math.max(ing.min_stock * 3, ing.stock_quantity, 1);
                    const pct = Math.min((ing.stock_quantity / maxDisplay) * 100, 100);
                    const isZero = ing.stock_quantity <= 0;
                    const isLow = ing.stock_quantity > 0 && ing.stock_quantity <= ing.min_stock;
                    const isOk = ing.stock_quantity > ing.min_stock;
                    const barColor = isZero
                      ? "bg-destructive"
                      : isLow
                        ? "bg-yellow-500"
                        : "bg-green-500";
                    return (
                      <div key={ing.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium flex items-center gap-1.5">
                            {isZero && <span className="text-destructive">⛔</span>}
                            {isLow && <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
                            {ing.name}
                          </span>
                          <span className={`font-mono text-xs ${isZero ? "text-destructive font-bold" : isLow ? "text-yellow-600 font-semibold" : "text-muted-foreground"}`}>
                            {ing.stock_quantity} / mín. {ing.min_stock} {ing.unit}
                          </span>
                        </div>
                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                          {/* Min stock marker */}
                          {ing.min_stock > 0 && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
                              style={{ left: `${Math.min((ing.min_stock / maxDisplay) * 100, 100)}%` }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          {/* Alerts */}
          {lowIngredients.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  ⚠️ Reposição Necessária ({lowIngredients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lowIngredients.map((i) => (
                    <Badge
                      key={i.id}
                      variant={i.stock_quantity <= 0 ? "destructive" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => openIngredientForm(i)}
                    >
                      {i.name}: {i.stock_quantity} {i.unit} (mín: {i.min_stock})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Buscar insumo..."
                value={ingSearch}
                onChange={(e) => setIngSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <IngredientBulkUpload ingredients={ingredients} onComplete={onRefreshIngredients} />
              <Button onClick={() => openIngredientForm()}>
                <Plus className="h-4 w-4 mr-1" />
                Novo Insumo
              </Button>
            </div>
          </div>

          {/* Ingredients Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Mínimo</TableHead>
                  <TableHead className="text-right">Custo/Unidade</TableHead>
                  <TableHead className="text-right">Valor em Estoque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {ingredients.length === 0
                        ? "Nenhum insumo cadastrado. Clique em 'Novo Insumo' para adicionar arroz, feijão, carne, etc."
                        : "Nenhum insumo encontrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIngredients.map((ing) => {
                    const isLow = ing.stock_quantity <= ing.min_stock;
                    const totalValue = ing.stock_quantity * ing.cost_per_unit;
                    return (
                      <TableRow key={ing.id} className={isLow ? "bg-yellow-50/50 dark:bg-yellow-950/10" : ""}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ing.name}</p>
                            <p className="text-xs text-muted-foreground">{ing.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-mono text-lg ${isLow ? "text-destructive font-bold" : ""}`}>
                            {ing.stock_quantity}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">{ing.unit}</span>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {ing.min_stock} {ing.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {fmt(ing.cost_per_unit)}/{ing.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          {fmt(totalValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => openIngredientForm(ing)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteIngredient(ing)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>

        </TabsContent>

        {/* ====== PRODUTOS TAB ====== */}
        <TabsContent value="products" className="space-y-4 mt-4">
          {/* Alerts */}
          {lowStockProducts.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas de Estoque ({lowStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lowStockProducts.map((p) => (
                    <Badge
                      key={p.id}
                      variant={(p.stock_quantity ?? 0) === 0 ? "destructive" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => setEntryProduct(p)}
                    >
                      {p.name}: {p.stock_quantity ?? 0} un.
                      {(p.stock_quantity ?? 0) === 0 && " ⛔"}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <Package className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                <div className="text-2xl font-bold">{stockProducts.length}</div>
                <div className="text-xs text-muted-foreground">Produtos c/ estoque</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto text-yellow-600 mb-1" />
                <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
                <div className="text-xs text-muted-foreground">Estoque baixo (≤5)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Package className="h-6 w-6 mx-auto text-destructive mb-1" />
                <div className="text-2xl font-bold text-destructive">{outOfStockProducts.length}</div>
                <div className="text-xs text-muted-foreground">Sem estoque</div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockProducts.map((product) => {
                  const stock = product.stock_quantity ?? 0;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-center font-mono text-lg">{stock}</TableCell>
                      <TableCell className="text-center">
                        {stock === 0 ? (
                          <Badge variant="destructive">Esgotado</Badge>
                        ) : stock <= 5 ? (
                          <Badge className="bg-yellow-500 text-white">Baixo</Badge>
                        ) : (
                          <Badge variant="outline">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" onClick={() => setEntryProduct(product)}>
                            <Plus className="h-3 w-3 mr-1" /> Entrada
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setHistoryProduct(product)}>
                            <History className="h-3 w-3 mr-1" /> Histórico
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {stockProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum produto com controle de estoque ativado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ingredient Form Dialog */}
      <Dialog open={ingDialogOpen} onOpenChange={setIngDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIngredient ? "Editar Insumo" : "Novo Insumo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Arroz, Feijão, Carne moída..."
                value={ingName}
                onChange={(e) => setIngName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={ingUnit} onValueChange={setIngUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Custo por {ingUnit} (R$)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={ingCost}
                  onChange={(e) => setIngCost(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Qtd em estoque ({ingUnit})</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={ingStock}
                  onChange={(e) => setIngStock(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque mínimo ({ingUnit})</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={ingMinStock}
                  onChange={(e) => setIngMinStock(e.target.value)}
                />
              </div>
            </div>
            {ingCost && ingStock && (
              <p className="text-xs text-muted-foreground">
                Valor total em estoque: <span className="font-semibold text-primary">
                  {fmt((parseFloat(ingCost.replace(",", ".")) || 0) * (parseFloat(ingStock.replace(",", ".")) || 0))}
                </span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIngDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveIngredient} disabled={!ingName.trim()}>
              {editingIngredient ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entry Dialog */}
      <Dialog open={!!entryProduct} onOpenChange={(o) => !o && setEntryProduct(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Entrada de Mercadoria</DialogTitle>
          </DialogHeader>
          {entryProduct && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{entryProduct.name}</p>
                <p className="text-sm text-muted-foreground">Estoque atual: {entryProduct.stock_quantity ?? 0} un.</p>
              </div>
              <div className="space-y-2">
                <Label>Quantidade a adicionar *</Label>
                <Input type="number" min="1" value={entryQty} onChange={(e) => setEntryQty(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Motivo / Nota fiscal</Label>
                <Textarea value={entryReason} onChange={(e) => setEntryReason(e.target.value)} placeholder="Ex: NF 12345 - Fornecedor X" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryProduct(null)}>Cancelar</Button>
            <Button onClick={handleEntry} disabled={!entryQty || parseInt(entryQty) <= 0}>Registrar Entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyProduct} onOpenChange={(o) => !o && setHistoryProduct(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico - {historyProduct?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
                ) : movements.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem movimentações</TableCell></TableRow>
                ) : (
                  movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{formatDate(m.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(m.type)}
                          <span className="text-xs">{getTypeLabel(m.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-center font-mono ${m.quantity > 0 ? "text-green-600" : "text-destructive"}`}>
                        {m.quantity > 0 ? "+" : ""}{m.quantity}
                      </TableCell>
                      <TableCell className="text-center text-xs">{m.previous_stock} → {m.new_stock}</TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{m.reason || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
