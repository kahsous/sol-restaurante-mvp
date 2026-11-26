import { useState, useEffect, forwardRef } from "react";
import { Plus, Minus, Trash2, DollarSign, Search, Printer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tab } from "@/types/tab";
import type { CartItem, ItemSize } from "@/types/menu";
import { TAB_STATUS_LABELS, TAB_STATUS_COLORS } from "@/types/tab";
import type { Product, Category } from "@/types/product";
import { printKitchenTicket } from "@/lib/printUtils";
import { productMatchesRestaurantDay } from "@/lib/restaurantDate";

const PRATOS_SEMANA_CAT = "11111111-0001-0001-0001-000000000001";

interface TabEditorProps {
  tab: Tab | null;
  products: Product[];
  categories: Category[];
  role: string;
  onClose: () => void;
  onUpdateItems: (tabId: string, items: CartItem[]) => Promise<boolean>;
  onRequestPayment: (tabId: string) => Promise<boolean>;
  onCancelTab: (tabId: string) => Promise<boolean>;
}

export const TabEditor = forwardRef<HTMLDivElement, TabEditorProps>(function TabEditor({
  tab,
  products,
  categories,
  role,
  onClose,
  onUpdateItems,
  onRequestPayment,
  onCancelTab,
}, ref) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (tab) {
      setItems(tab.items);
    }
  }, [tab]);

  if (!tab) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const filteredProducts = products.filter((product) => {
    if (!product.is_active) return false;
    if (product.availability === "delivery") return false; // Only restaurant/both in PDV

    if (product.category_id === PRATOS_SEMANA_CAT) {
      if (!productMatchesRestaurantDay(product.description)) return false;
    }

    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getAvailableSizesForPdv = (product: Product): ItemSize[] => {
    const sizes: ItemSize[] = [];
    const ap = product.availability_pequena || "both";
    const am = product.availability_media || "both";
    const ag = product.availability_grande || "both";

    if (product.price_pequena > 0 && (ap === "restaurant" || ap === "both")) sizes.push("pequena");
    if (product.price_media > 0 && (am === "restaurant" || am === "both")) sizes.push("media");
    if (product.price_grande > 0 && (ag === "restaurant" || ag === "both")) sizes.push("grande");

    return sizes;
  };

  const addItem = (product: Product, size: ItemSize) => {
    // Check stock availability
    if (product.track_stock) {
      const currentStock = product.stock_quantity ?? 0;
      const existingQty = items
        .filter((i) => i.id === product.id)
        .reduce((sum, i) => sum + i.quantity, 0);
      if (existingQty >= currentStock) {
        return; // Block - out of stock
      }
    }

    const cartItemId = `${product.id}-${size}`;
    
    const newItem: CartItem = {
      id: product.id,
      name: product.name,
      description: product.description || "",
      category: product.category_id || "",
      pricePequena: product.price_pequena,
      priceMedia: product.price_media,
      priceGrande: product.price_grande,
      trackStock: product.track_stock,
      stockQuantity: product.stock_quantity,
      availableSizes: getAvailableSizesForPdv(product),
      quantity: 1,
      size,
      selectedOptions: [],
      unitPrice: size === "pequena" ? product.price_pequena : size === "media" ? product.price_media : product.price_grande,
    };


    setItems((prev) => {
      const existing = prev.find((i) => `${i.id}-${i.size}` === cartItemId);
      if (existing) {
        return prev.map((i) =>
          `${i.id}-${i.size}` === cartItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, newItem];
    });

    // Print kitchen ticket for new item
    printKitchenTicket(tab.tab_number, [newItem], tab.customer_name);
  };

  const updateQuantity = (itemId: string, size: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (`${item.id}-${item.size}` === `${itemId}-${size}`) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (itemId: string, size: string) => {
    setItems((prev) => prev.filter((item) => `${item.id}-${item.size}` !== `${itemId}-${size}`));
  };

  const subtotal = items.reduce((acc, item) => {
    const price = item.size === "pequena" ? item.pricePequena : item.size === "media" ? item.priceMedia : item.priceGrande;
    return acc + price * item.quantity;
  }, 0);

  const handleSave = async () => {
    await onUpdateItems(tab.id, items);
  };

  const handleRequestPayment = async () => {
    await onUpdateItems(tab.id, items);
    await onRequestPayment(tab.id);
    onClose();
  };

  const handleCancel = async () => {
    await onCancelTab(tab.id);
    onClose();
  };

  const isEditable = tab.status === "open" || tab.status === "consuming";
  const canRequestPayment = (tab.status === "open" || tab.status === "consuming") && items.length > 0;

  return (
    <Sheet open={!!tab} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full max-w-[100vw] sm:max-w-3xl lg:max-w-5xl flex flex-col p-0 overflow-hidden">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="font-mono font-bold text-xl text-primary">{tab.code}</span>
              </div>
              <div>
                <SheetTitle className="text-left">Comanda {tab.code}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={TAB_STATUS_COLORS[tab.status]}>
                    {TAB_STATUS_LABELS[tab.status]}
                  </Badge>
                  {tab.customer_name && (
                    <span className="text-sm text-muted-foreground">• {tab.customer_name}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)] overflow-hidden">
            {/* Products list */}
            {isEditable && (
              <div className="min-w-0 border-b md:border-b-0 md:border-r flex flex-col overflow-hidden">
                <div className="p-3 border-b space-y-2">
                  <Input
                    placeholder="Buscar produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {filteredProducts.map((product) => {
                      const outOfStock = product.track_stock && (product.stock_quantity ?? 0) <= 0;
                      const existingQty = items.filter((i) => i.id === product.id).reduce((s, i) => s + i.quantity, 0);
                      const maxReached = product.track_stock && existingQty >= (product.stock_quantity ?? 0);
                      return (
                        <div key={product.id} className={`p-2 border rounded-lg ${outOfStock ? "opacity-40" : "hover:bg-muted/50"}`}>
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{product.name}</p>
                            {product.track_stock && (
                              <span className={`text-[10px] ${(product.stock_quantity ?? 0) <= 5 ? "text-destructive" : "text-muted-foreground"}`}>
                                Est: {product.stock_quantity ?? 0}
                              </span>
                            )}
                          </div>
                          {outOfStock ? (
                            <p className="text-xs text-destructive mt-1">⛔ Sem estoque</p>
                          ) : (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {getAvailableSizesForPdv(product).map((size) => {
                                const label = size === "pequena" ? "P" : size === "media" ? "M" : "G";
                                const price = size === "pequena" ? product.price_pequena : size === "media" ? product.price_media : product.price_grande;
                                return (
                                  <Button key={size} size="sm" variant="outline" className="text-xs h-7" onClick={() => addItem(product, size)} disabled={maxReached}>
                                    {label} {formatCurrency(price)}
                                  </Button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Cart items */}
            <div className="min-w-0 flex flex-col overflow-hidden">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Itens ({items.length})</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {items.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum item adicionado</p>
                  ) : (
                    items.map((item) => {
                      const price = item.size === "pequena" ? item.pricePequena : item.size === "media" ? item.priceMedia : item.priceGrande;
                      return (
                        <div key={`${item.id}-${item.size}`} className="flex items-center gap-2 p-2 border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.size === "pequena" ? "Pequena" : item.size === "media" ? "Média" : "Grande"} • {formatCurrency(price)}
                            </p>
                          </div>
                          {isEditable ? (
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.size, -1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.size, 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id, item.size)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm font-medium">x{item.quantity}</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex gap-2">
              {isEditable && (
                <>
                  <Button variant="outline" className="flex-1" onClick={handleSave}>
                    Salvar
                  </Button>
                  <Button variant="default" className="flex-1" onClick={handleRequestPayment} disabled={!canRequestPayment}>
                    <DollarSign className="h-4 w-4 mr-1" />
                    Enviar ao Caixa
                  </Button>
                </>
              )}
              {tab.status === "awaiting_payment" && (
                <p className="text-center text-muted-foreground w-full py-2">
                  Aguardando pagamento no caixa
                </p>
              )}
              {(role === "admin" || role === "super_admin") && tab.status !== "free" && (
                <Button variant="destructive" size="sm" onClick={handleCancel}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});
