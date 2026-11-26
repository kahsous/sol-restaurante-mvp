import { useState } from "react";
import { Loader2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types/product";

interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onUpdateStock: (id: string, quantity: number) => Promise<{ error: Error | null }>;
}

export function StockAdjustDialog({
  open,
  onOpenChange,
  product,
  onUpdateStock,
}: StockAdjustDialogProps) {
  const [quantity, setQuantity] = useState(product.stock_quantity?.toString() || "0");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const currentStock = product.stock_quantity ?? 0;
  const newStock = parseInt(quantity) || 0;
  const difference = newStock - currentStock;

  const handleQuickAdjust = (delta: number) => {
    const current = parseInt(quantity) || 0;
    setQuantity(Math.max(0, current + delta).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    const { error } = await onUpdateStock(product.id, newStock);

    if (error) {
      toast({
        title: "Erro ao atualizar estoque",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Estoque atualizado",
        description: `${product.name}: ${currentStock} → ${newStock} unidades`,
      });
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
          <DialogDescription>
            {product.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Estoque atual</p>
              <p className="text-3xl font-bold">{currentStock}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuickAdjust(-10)}
              >
                -10
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuickAdjust(-1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-center text-lg font-bold"
              />
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuickAdjust(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuickAdjust(10)}
              >
                +10
              </Button>
            </div>

            {difference !== 0 && (
              <p className={`text-center text-sm ${difference > 0 ? "text-green-600" : "text-red-600"}`}>
                {difference > 0 ? "+" : ""}{difference} unidades
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || difference === 0}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
