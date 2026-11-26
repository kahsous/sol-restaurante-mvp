import { useState } from "react";
import { Plus, Trash2, ChefHat, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Ingredient, ProductRecipe } from "@/hooks/useIngredients";
import type { Product } from "@/types/product";

const UNITS = ["g", "kg", "ml", "L", "un"];

interface RecipeManagementProps {
  products: Product[];
  ingredients: Ingredient[];
  getProductRecipes: (productId: string) => ProductRecipe[];
  getProductCost: (productId: string) => number;
  onAddRecipeItem: (productId: string, ingredientId: string, quantity: number, unit: string) => Promise<{ error: any }>;
  onRemoveRecipeItem: (id: string) => Promise<{ error: any }>;
  onCreateIngredient: (data: Partial<Ingredient>) => Promise<{ error: any }>;
  onUpdateIngredient: (id: string, data: Partial<Ingredient>) => Promise<{ error: any }>;
  onDeleteIngredient: (id: string) => Promise<{ error: any }>;
}

export function RecipeManagement({
  products, ingredients, getProductRecipes, getProductCost,
  onAddRecipeItem, onRemoveRecipeItem, onCreateIngredient, onUpdateIngredient, onDeleteIngredient,
}: RecipeManagementProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [newIngName, setNewIngName] = useState("");
  const [newIngUnit, setNewIngUnit] = useState("g");
  const [newIngCost, setNewIngCost] = useState("");
  const [newIngMinStock, setNewIngMinStock] = useState("");
  const [addIngId, setAddIngId] = useState("");
  const [addIngQty, setAddIngQty] = useState("");
  const [addIngUnit, setAddIngUnit] = useState("g");
  const [ingDialogOpen, setIngDialogOpen] = useState(false);
  const { toast } = useToast();

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleCreateIngredient = async () => {
    if (!newIngName.trim()) return;
    const { error } = await onCreateIngredient({
      name: newIngName.trim(),
      unit: newIngUnit,
      cost_per_unit: parseFloat(newIngCost) || 0,
      min_stock: parseFloat(newIngMinStock) || 0,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ingrediente cadastrado" });
      setNewIngName(""); setNewIngCost(""); setNewIngMinStock("");
      setIngDialogOpen(false);
    }
  };

  const handleAddToRecipe = async () => {
    if (!selectedProduct || !addIngId || !addIngQty) return;
    const { error } = await onAddRecipeItem(selectedProduct, addIngId, parseFloat(addIngQty), addIngUnit);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ingrediente adicionado à receita" });
      setAddIngId(""); setAddIngQty("");
    }
  };

  const product = products.find((p) => p.id === selectedProduct);
  const recipeItems = selectedProduct ? getProductRecipes(selectedProduct) : [];
  const cost = selectedProduct ? getProductCost(selectedProduct) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ChefHat className="h-5 w-5" /> Ficha Técnica / Receitas
        </h2>
        <Dialog open={ingDialogOpen} onOpenChange={setIngDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Ingrediente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Ingrediente</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome do ingrediente" value={newIngName} onChange={(e) => setNewIngName(e.target.value)} />
              <div className="grid grid-cols-3 gap-2">
                <Select value={newIngUnit} onValueChange={setNewIngUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" placeholder="Custo/unidade" value={newIngCost} onChange={(e) => setNewIngCost(e.target.value)} />
                <Input type="number" placeholder="Estoque mín." value={newIngMinStock} onChange={(e) => setNewIngMinStock(e.target.value)} />
              </div>
              <Button onClick={handleCreateIngredient} className="w-full">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ingredients list */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Ingredientes Cadastrados ({ingredients.length})</CardTitle></CardHeader>
        <CardContent>
          {ingredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum ingrediente cadastrado</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {ingredients.map((ing) => (
                <div key={ing.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                  <div>
                    <span className="font-medium">{ing.name}</span>
                    <span className="text-muted-foreground ml-1">({ing.unit})</span>
                    <div className="text-xs text-muted-foreground">
                      Custo: {fmt(ing.cost_per_unit)}/{ing.unit} • Estoque: {ing.stock_quantity} {ing.unit}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDeleteIngredient(ing.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product recipe editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Selecionar Produto para Ficha Técnica</CardTitle>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger><SelectValue placeholder="Escolha um produto" /></SelectTrigger>
            <SelectContent>
              {products.filter((p) => p.is_active).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        {selectedProduct && product && (
          <CardContent className="space-y-4">
            {/* CMV display */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-destructive/10 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Custo (CMV)</p>
                <p className="text-lg font-bold text-destructive">{fmt(cost)}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Preço Venda (M)</p>
                <p className="text-lg font-bold text-primary">{fmt(product.price_media)}</p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Lucro Bruto</p>
                <p className="text-lg font-bold text-green-600">
                  {fmt(product.price_media - cost)}
                  {product.price_media > 0 && (
                    <span className="text-xs ml-1">({((1 - cost / product.price_media) * 100).toFixed(0)}%)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Recipe items */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Ingredientes da Receita</h4>
              {recipeItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum ingrediente vinculado</p>
              ) : (
                recipeItems.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                    <span>{r.quantity} {r.unit} — {r.ingredient?.name || "?"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{fmt(r.quantity * (r.ingredient?.cost_per_unit || 0))}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onRemoveRecipeItem(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add ingredient to recipe */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select value={addIngId} onValueChange={setAddIngId}>
                  <SelectTrigger><SelectValue placeholder="Ingrediente" /></SelectTrigger>
                  <SelectContent>
                    {ingredients.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input type="number" placeholder="Qtd" className="w-20" value={addIngQty} onChange={(e) => setAddIngQty(e.target.value)} />
              <Select value={addIngUnit} onValueChange={setAddIngUnit}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" onClick={handleAddToRecipe}><Plus className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
