import { useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, Search, Package, AlertTriangle, Star, Puzzle, Layers, FileUp } from "lucide-react";
import { MenuPdfImport } from "./MenuPdfImport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "./ProductForm";
import { StockAdjustDialog } from "./StockAdjustDialog";
import { BulkPriceEditor } from "./BulkPriceEditor";
import type { Product, Category, ProductFormData } from "@/types/product";

interface ProductListProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  onCreateProduct: (data: ProductFormData) => Promise<{ error: Error | null }>;
  onUpdateProduct: (id: string, data: Partial<ProductFormData>) => Promise<{ error: Error | null }>;
  onToggleActive: (id: string, isActive: boolean) => Promise<{ error: Error | null }>;
  onUpdateStock: (id: string, quantity: number) => Promise<{ error: Error | null }>;
}

export function ProductList({
  products,
  categories,
  loading,
  onCreateProduct,
  onUpdateProduct,
  onToggleActive,
  onUpdateStock,
}: ProductListProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [channelFilter, setChannelFilter] = useState<"all" | "site_tv" | "pdv">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [pdfImportOpen, setPdfImportOpen] = useState(false);
  const { toast } = useToast();

  const formatPrice = (price: number) =>
    `R$ ${price.toFixed(2).replace(".", ",")}`;

  const isVisibleOnSite = (product: Product) => {
    const globalAvail = product.availability || "both";
    if (globalAvail === "restaurant") return false;

    return (
      (product.price_pequena > 0 && ["delivery", "both"].includes(product.availability_pequena || "both")) ||
      (product.price_media > 0 && ["delivery", "both"].includes(product.availability_media || "both")) ||
      (product.price_grande > 0 && ["delivery", "both"].includes(product.availability_grande || "both"))
    );
  };

  const isVisibleOnPdv = (product: Product) => {
    const globalAvail = product.availability || "both";
    if (globalAvail === "delivery") return false;

    return (
      (product.price_pequena > 0 && ["restaurant", "both"].includes(product.availability_pequena || "both")) ||
      (product.price_media > 0 && ["restaurant", "both"].includes(product.availability_media || "both")) ||
      (product.price_grande > 0 && ["restaurant", "both"].includes(product.availability_grande || "both"))
    );
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category_id === categoryFilter;
    const matchesActive = showInactive || product.is_active;
    const matchesChannel =
      channelFilter === "all" ||
      (channelFilter === "site_tv" ? isVisibleOnSite(product) : isVisibleOnPdv(product));
    return matchesSearch && matchesCategory && matchesActive && matchesChannel;
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleAdjustStock = (product: Product) => {
    setStockProduct(product);
  };

  const handleToggleActive = async (product: Product) => {
    const newStatus = !product.is_active;
    const { error } = await onToggleActive(product.id, newStatus);

    if (error) {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: newStatus ? "Produto ativado" : "Produto desativado",
        description: `${product.name} foi ${newStatus ? "ativado" : "desativado"}`,
      });
    }
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  const getStockBadge = (product: Product) => {
    if (!product.track_stock) {
      return null;
    }

    const stock = product.stock_quantity ?? 0;
    
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Esgotado
        </Badge>
      );
    }
    
    if (stock <= 5) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
          {stock} un.
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        {stock} un.
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
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
          <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as "all" | "site_tv" | "pdv")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos canais</SelectItem>
              <SelectItem value="site_tv">Somente site/TV</SelectItem>
              <SelectItem value="pdv">Somente PDV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? (
              <>
                <ToggleRight className="h-4 w-4 mr-1" />
                Mostrando inativos
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4 mr-1" />
                Apenas ativos
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setPdfImportOpen(true)}>
            <FileUp className="h-4 w-4 mr-1" />
            Importar PDF
          </Button>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Layers className="h-4 w-4 mr-1" />
            Preços em massa
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando produtos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              Nenhum produto encontrado
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {products.length === 0
                ? "Clique em 'Novo Produto' para começar"
                : "Tente ajustar os filtros"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className={!product.is_active ? "opacity-50" : ""}
                >
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium">{product.name}</p>
                        {product.is_featured && (
                          <Star className="h-3.5 w-3.5 fill-primary text-primary shrink-0" />
                        )}
                      </div>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      )}
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {isVisibleOnSite(product) && <Badge variant="outline" className="text-[10px]">Site/TV</Badge>}
                        {isVisibleOnPdv(product) && <Badge variant="outline" className="text-[10px]">PDV</Badge>}
                        {product.is_featured && (
                          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                            ⭐ Destaque
                          </Badge>
                        )}
                        {(product.option_groups_count ?? 0) > 0 && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Puzzle className="h-2.5 w-2.5" />
                            {product.option_groups_count} compl.
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {product.category ? (
                      <Badge variant="secondary">
                        {product.category.icon} {product.category.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Sem categoria
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {product.sold_by_weight ? (
                      <span className="text-primary">
                        R$ {product.price_per_kg?.toFixed(2).replace(".", ",")}/kg
                      </span>
                    ) : product.price_media === product.price_grande ? (
                      <div>{formatPrice(product.price_media)}</div>
                    ) : (
                      <div className="text-xs">
                        <div>M: {formatPrice(product.price_media)}</div>
                        <div>G: {formatPrice(product.price_grande)}</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.track_stock ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1"
                        onClick={() => handleAdjustStock(product)}
                      >
                        {getStockBadge(product)}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {product.availability === "both" ? "🔄 Ambos" : product.availability === "restaurant" ? "🍽️ Rest." : "🛵 Deliv."}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(product)}
                      >
                        {product.is_active ? (
                          <ToggleRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Product Form Modal */}
      <ProductForm
        open={formOpen}
        onOpenChange={handleFormClose}
        product={editingProduct}
        categories={categories}
        onSave={onCreateProduct}
        onUpdate={onUpdateProduct}
      />

      {/* Stock Adjust Dialog */}
      {stockProduct && (
        <StockAdjustDialog
          open={!!stockProduct}
          onOpenChange={(open) => !open && setStockProduct(null)}
          product={stockProduct}
          onUpdateStock={onUpdateStock}
        />
      )}

      {/* Bulk Price Editor */}
      <BulkPriceEditor
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        products={products}
        categories={categories}
      />

      {/* PDF Menu Import */}
      <MenuPdfImport
        open={pdfImportOpen}
        onOpenChange={setPdfImportOpen}
        products={products}
        categories={categories}
      />
    </div>
  );
}
