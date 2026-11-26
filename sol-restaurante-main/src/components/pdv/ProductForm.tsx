import { useState, useEffect, useRef } from "react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { OptionGroupsEditor, saveOptionGroups, type EditorGroup } from "./OptionGroupsEditor";
import type { Product, Category, ProductFormData } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus } from "lucide-react";


interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  categories: Category[];
  onSave: (data: ProductFormData) => Promise<{ error: Error | null }>;
  onUpdate: (id: string, data: Partial<ProductFormData>) => Promise<{ error: Error | null }>;
}

export function ProductForm({
  open,
  onOpenChange,
  product,
  categories,
  onSave,
  onUpdate,
}: ProductFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [hasSizes, setHasSizes] = useState(false);
  const [singlePrice, setSinglePrice] = useState("");
  const [pricePequena, setPricePequena] = useState("");
  const [priceMedia, setPriceMedia] = useState("");
  const [priceGrande, setPriceGrande] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [trackStock, setTrackStock] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [soldByWeight, setSoldByWeight] = useState(false);
  const [pricePerKg, setPricePerKg] = useState("");
  const [availability, setAvailability] = useState<"restaurant" | "delivery" | "both">("both");
  const [availabilityPequena, setAvailabilityPequena] = useState<"restaurant" | "delivery" | "both">("both");
  const [availabilityMedia, setAvailabilityMedia] = useState<"restaurant" | "delivery" | "both">("both");
  const [availabilityGrande, setAvailabilityGrande] = useState<"restaurant" | "delivery" | "both">("both");
  const [costPrice, setCostPrice] = useState("");
  const [priceMultiplier, setPriceMultiplier] = useState("");
  const [isCombo, setIsCombo] = useState(false);
  const [serves, setServes] = useState("");
  const [saleStart, setSaleStart] = useState("");
  const [saleEnd, setSaleEnd] = useState("");
  const [comboItems, setComboItems] = useState<Array<{ product_id: string; quantity: number }>>([]);
  const [allProducts, setAllProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState("info");
  const optionGroupsRef = useRef<EditorGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();


  const isEditing = !!product;

  useEffect(() => {
    if (!open) return;
    supabase.from("products").select("id,name").eq("is_active", true).order("name").then(({ data }) => {
      setAllProducts((data ?? []).filter((p) => p.id !== product?.id));
    });
  }, [open, product?.id]);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setCategoryId(product.category_id || "");
      
      // Detect if product has size variations
      // If P is 0 (default) and M===G, it's a single-price product, not a size variation
      const pp = Number(product.price_pequena ?? 0);
      const pm = Number(product.price_media);
      const pg = Number(product.price_grande);
      const productHasSizes = (pp > 0 && (pp !== pm || pm !== pg)) || (pp === 0 && pm !== pg);
      setHasSizes(productHasSizes);
      
      if (productHasSizes) {
        setPricePequena(pp > 0 ? pp.toString().replace(".", ",") : "");
        setPriceMedia(pm.toString().replace(".", ","));
        setPriceGrande(pg.toString().replace(".", ","));
        setSinglePrice("");
      } else {
        // Use the non-zero price as the single price
        const effectivePrice = pm > 0 ? pm : pg;
        setSinglePrice(effectivePrice.toString().replace(".", ","));
        setPricePequena("");
        setPriceMedia("");
        setPriceGrande("");
      }
      
      setIsActive(product.is_active);
      setIsFeatured(product.is_featured ?? false);
      setTrackStock(product.track_stock);

      setStockQuantity(product.stock_quantity?.toString() || "");
      setSoldByWeight(product.sold_by_weight);
      setPricePerKg(product.price_per_kg?.toString().replace(".", ",") || "");
      setAvailability(product.availability || "both");
      setAvailabilityPequena(product.availability_pequena || "both");
      setAvailabilityMedia(product.availability_media || "both");
      setAvailabilityGrande(product.availability_grande || "both");
      setCostPrice(product.cost_price?.toString().replace(".", ",") || "");
      setPriceMultiplier(product.price_multiplier?.toString().replace(".", ",") || "");
      setIsCombo(product.is_combo ?? false);
      setServes(product.serves ? String(product.serves) : "");
      setSaleStart(product.sale_start ? product.sale_start.slice(0, 5) : "");
      setSaleEnd(product.sale_end ? product.sale_end.slice(0, 5) : "");
      setComboItems(Array.isArray(product.combo_items) ? product.combo_items : []);
    } else {
      resetForm();
    }
  }, [product, open]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategoryId("");
    setHasSizes(false);
    setSinglePrice("");
    setPricePequena("");
    setPriceMedia("");
    setPriceGrande("");
    setIsActive(true);
    setIsFeatured(false);
    setTrackStock(false);

    setStockQuantity("");
    setSoldByWeight(false);
    setPricePerKg("");
    setAvailability("both");
    setAvailabilityPequena("both");
    setAvailabilityMedia("both");
    setAvailabilityGrande("both");
    setCostPrice("");
    setPriceMultiplier("");
    setIsCombo(false);
    setServes("");
    setSaleStart("");
    setSaleEnd("");
    setComboItems([]);
  };

  const parsePrice = (value: string) => parseFloat(value.replace(",", ".")) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do produto",
        variant: "destructive",
      });
      return;
    }

    if (soldByWeight && !pricePerKg) {
      toast({
        title: "Preço por kg obrigatório",
        description: "Informe o preço por kg para produtos vendidos por peso",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const computedPriceMedia = hasSizes ? parsePrice(priceMedia) : parsePrice(singlePrice);
    const computedPriceGrande = hasSizes ? parsePrice(priceGrande) : parsePrice(singlePrice);
    const computedPricePequena = hasSizes ? parsePrice(pricePequena) : 0;

    const parsedCost = parsePrice(costPrice);
    const parsedMultiplier = parsePrice(priceMultiplier);

    const formData: ProductFormData = {
      name: name.trim(),
      description: description.trim(),
      category_id: categoryId,
      price_pequena: computedPricePequena,
      price_media: computedPriceMedia,
      price_grande: computedPriceGrande,
      is_active: isActive,
      is_featured: isFeatured,
      track_stock: trackStock,

      stock_quantity: trackStock ? (parseInt(stockQuantity) || 0) : null,
      sold_by_weight: soldByWeight,
      price_per_kg: soldByWeight ? parsePrice(pricePerKg) : null,
      availability,
      availability_pequena: availabilityPequena,
      availability_media: availabilityMedia,
      availability_grande: availabilityGrande,
      cost_price: parsedCost > 0 ? parsedCost : null,
      price_multiplier: parsedMultiplier > 0 ? parsedMultiplier : null,
      is_combo: isCombo,
      serves: isCombo && serves ? parseInt(serves) : null,
      sale_start: saleStart || null,
      sale_end: saleEnd || null,
      combo_items: isCombo ? comboItems.filter((c) => c.product_id && c.quantity > 0) : [],
    };

    const result = isEditing
      ? await onUpdate(product!.id, formData).then((r) => ({ ...r, data: product }))
      : await onSave(formData);

    if (result.error) {
      toast({
        title: `Erro ao ${isEditing ? "atualizar" : "criar"} produto`,
        description: result.error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Persist option groups for the saved/updated product
    const savedId = (result as { data?: { id?: string } }).data?.id || product?.id;
    if (savedId) {
      try {
        await saveOptionGroups(savedId, optionGroupsRef.current);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        toast({ title: "Aviso ao salvar complementos", description: msg, variant: "destructive" });
      }
    }

    toast({
      title: isEditing ? "Produto atualizado" : "Produto criado",
      description: `${name} foi ${isEditing ? "atualizado" : "adicionado"} com sucesso`,
    });
    onOpenChange(false);
    resetForm();
    setLoading(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do produto"
              : "Preencha os dados do novo produto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="py-2">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="info">Produto</TabsTrigger>
              <TabsTrigger value="combo">Combo/Horário</TabsTrigger>
              <TabsTrigger value="complements">
                Complementos
                {optionGroupsRef.current.length > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/15 text-primary px-1.5 rounded">
                    {optionGroupsRef.current.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>

              <Input
                id="name"
                placeholder="Ex: Marmitex Completa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição do produto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cost Price & Multiplier Section */}
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm font-semibold">💰 Preço de Custo</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cost-price">Custo (R$)</Label>
                  <Input
                    id="cost-price"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={costPrice}
                    onChange={(e) => {
                      setCostPrice(e.target.value);
                      // Auto-calculate selling price if multiplier exists
                      const cost = parseFloat(e.target.value.replace(",", ".")) || 0;
                      const mult = parseFloat(priceMultiplier.replace(",", ".")) || 0;
                      if (cost > 0 && mult > 0) {
                        const selling = (cost * mult).toFixed(2).replace(".", ",");
                        if (!hasSizes && !soldByWeight) {
                          setSinglePrice(selling);
                        }
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-multiplier">Multiplicador (x)</Label>
                  <Input
                    id="price-multiplier"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 2,5"
                    value={priceMultiplier}
                    onChange={(e) => {
                      setPriceMultiplier(e.target.value);
                      // Auto-calculate selling price if cost exists
                      const cost = parseFloat(costPrice.replace(",", ".")) || 0;
                      const mult = parseFloat(e.target.value.replace(",", ".")) || 0;
                      if (cost > 0 && mult > 0) {
                        const selling = (cost * mult).toFixed(2).replace(".", ",");
                        if (!hasSizes && !soldByWeight) {
                          setSinglePrice(selling);
                        }
                      }
                    }}
                  />
                </div>
              </div>
              {parseFloat(costPrice.replace(",", ".")) > 0 && parseFloat(priceMultiplier.replace(",", ".")) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Preço de venda sugerido: <span className="font-semibold text-primary">
                    R$ {(parseFloat(costPrice.replace(",", ".")) * parseFloat(priceMultiplier.replace(",", "."))).toFixed(2).replace(".", ",")}
                  </span>
                </p>
              )}
            </div>

            {/* Weight-based sale section */}
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sold-by-weight">Venda por peso (kg)</Label>
                  <p className="text-xs text-muted-foreground">
                    Para self-service com balança
                  </p>
                </div>
                <Switch
                  id="sold-by-weight"
                  checked={soldByWeight}
                  onCheckedChange={setSoldByWeight}
                />
              </div>

              {soldByWeight && (
                <div className="space-y-2">
                  <Label htmlFor="price-per-kg">Preço por kg (R$) *</Label>
                  <Input
                    id="price-per-kg"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Size-based pricing (only if not sold by weight) */}
            {!soldByWeight && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="has-sizes">Variação de tamanho</Label>
                    <p className="text-xs text-muted-foreground">
                      Ative para produtos com tamanhos P, M e G
                    </p>
                  </div>
                  <Switch
                    id="has-sizes"
                    checked={hasSizes}
                    onCheckedChange={setHasSizes}
                  />
                </div>

                {hasSizes ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="price-pequena">Pequena (R$)</Label>
                      <Input
                        id="price-pequena"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={pricePequena}
                        onChange={(e) => setPricePequena(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price-media">Média (R$)</Label>
                      <Input
                        id="price-media"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={priceMedia}
                        onChange={(e) => setPriceMedia(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price-grande">Grande (R$)</Label>
                      <Input
                        id="price-grande"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={priceGrande}
                        onChange={(e) => setPriceGrande(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="single-price">Preço (R$)</Label>
                    <Input
                      id="single-price"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={singlePrice}
                      onChange={(e) => setSinglePrice(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Stock Control Section */}
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="track-stock">Controlar estoque</Label>
                  <p className="text-xs text-muted-foreground">
                    Baixa automática ao finalizar pedido
                  </p>
                </div>
                <Switch
                  id="track-stock"
                  checked={trackStock}
                  onCheckedChange={setTrackStock}
                />
              </div>

              {trackStock && (
                <div className="space-y-2">
                  <Label htmlFor="stock-quantity">Quantidade em estoque</Label>
                  <Input
                    id="stock-quantity"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <Label>Disponibilidade geral</Label>
              <Select value={availability} onValueChange={(v) => setAvailability(v as "restaurant" | "delivery" | "both")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">🔄 Ambos (Restaurante + Delivery)</SelectItem>
                  <SelectItem value="restaurant">🍽️ Apenas Restaurante</SelectItem>
                  <SelectItem value="delivery">🛵 Apenas Delivery</SelectItem>
                </SelectContent>
              </Select>

              {hasSizes && (
                <div className="space-y-2 mt-3 pt-3 border-t border-border">
                  <Label className="text-sm font-semibold">📏 Disponibilidade por tamanho</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Escolha onde cada tamanho aparece
                  </p>
                  {[
                    { label: "Pequena (P)", value: availabilityPequena, setter: setAvailabilityPequena },
                    { label: "Média (M)", value: availabilityMedia, setter: setAvailabilityMedia },
                    { label: "Grande (G)", value: availabilityGrande, setter: setAvailabilityGrande },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-sm w-24 shrink-0">{item.label}</span>
                      <Select value={item.value} onValueChange={(v) => item.setter(v as "restaurant" | "delivery" | "both")}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">🔄 Ambos</SelectItem>
                          <SelectItem value="restaurant">🍽️ Restaurante</SelectItem>
                          <SelectItem value="delivery">🛵 Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-active">Produto ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Produtos inativos não aparecem no site
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="space-y-0.5">
                <Label htmlFor="is-featured" className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  Destaque na vitrine
                </Label>
                <p className="text-xs text-muted-foreground">
                  Aparece na seção "Destaques" no topo do cardápio
                </p>
              </div>
              <Switch
                id="is-featured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
            </div>
            </TabsContent>

            <TabsContent value="combo" className="space-y-4 py-4">
              <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-combo">É um combo</Label>
                    <p className="text-xs text-muted-foreground">
                      Combos agrupam vários produtos com preço promocional
                    </p>
                  </div>
                  <Switch id="is-combo" checked={isCombo} onCheckedChange={setIsCombo} />
                </div>

                {isCombo && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="serves">Serve quantas pessoas</Label>
                      <Input
                        id="serves"
                        type="number"
                        min="1"
                        placeholder="Ex: 2"
                        value={serves}
                        onChange={(e) => setServes(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Produtos do combo</Label>
                      {comboItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Select
                            value={item.product_id}
                            onValueChange={(v) => {
                              const next = [...comboItems];
                              next[idx] = { ...next[idx], product_id: v };
                              setComboItems(next);
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecionar produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {allProducts.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min="1"
                            className="w-20"
                            value={item.quantity}
                            onChange={(e) => {
                              const next = [...comboItems];
                              next[idx] = { ...next[idx], quantity: parseInt(e.target.value) || 1 };
                              setComboItems(next);
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setComboItems(comboItems.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setComboItems([...comboItems, { product_id: "", quantity: 1 }])}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar item
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Dica: defina o preço do combo (na aba Produto) menor que a soma individual.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                <Label>Horário de venda (opcional)</Label>
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para vender o dia todo. Fora do intervalo o item some do cardápio.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="sale-start" className="text-xs">Início</Label>
                    <Input
                      id="sale-start"
                      type="time"
                      value={saleStart}
                      onChange={(e) => setSaleStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sale-end" className="text-xs">Fim</Label>
                    <Input
                      id="sale-end"
                      type="time"
                      value={saleEnd}
                      onChange={(e) => setSaleEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="complements" className="py-4">
              {isEditing && product ? (
                <OptionGroupsEditor
                  productId={product.id}
                  onChange={(g) => { optionGroupsRef.current = g; }}
                />
              ) : (
                <div className="text-center py-8 px-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                  Salve o produto primeiro para adicionar complementos.
                </div>
              )}
            </TabsContent>
          </Tabs>


          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                "Salvar"
              ) : (
                "Criar Produto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
