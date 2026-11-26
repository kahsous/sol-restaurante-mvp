import { useState, useEffect } from "react";
import { Scale, RefreshCw, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useScale } from "@/hooks/useScale";
import type { Product } from "@/types/product";

interface WeightSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onAddWeightItem: (item: {
    productId: string;
    productName: string;
    weightKg: number;
    pricePerKg: number;
    total: number;
  }) => void;
}

export function WeightSaleDialog({
  open,
  onOpenChange,
  products,
  onAddWeightItem,
}: WeightSaleDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [manualWeight, setManualWeight] = useState("");
  const { toast } = useToast();

  const {
    connected,
    currentWeight,
    simulatedMode,
    error: scaleError,
    connect,
    disconnect,
    setSimulatedWeight,
    captureWeight,
    calculateTotal,
  } = useScale();

  const weightProducts = products.filter((p) => p.sold_by_weight && p.is_active);
  const selectedProduct = weightProducts.find((p) => p.id === selectedProductId);
  const pricePerKg = selectedProduct?.price_per_kg || 0;
  const currentWeightKg = currentWeight?.weight_kg || 0;
  const isStable = currentWeight?.stable ?? true;
  const total = calculateTotal(currentWeightKg, pricePerKg);

  useEffect(() => {
    if (open && !connected) {
      connect();
    }
  }, [open, connected, connect]);

  const handleManualWeightChange = (value: string) => {
    setManualWeight(value);
    const weight = parseFloat(value.replace(",", ".")) || 0;
    setSimulatedWeight(weight);
  };

  const handleCapture = () => {
    if (!selectedProductId) {
      toast({ title: "Selecione um produto", description: "Escolha o produto antes de capturar o peso", variant: "destructive" });
      return;
    }

    const weight = captureWeight();
    if (weight <= 0) {
      toast({ title: "Peso inválido", description: "O peso deve ser maior que zero", variant: "destructive" });
      return;
    }

    const itemTotal = calculateTotal(weight, pricePerKg);
    onAddWeightItem({
      productId: selectedProductId,
      productName: selectedProduct!.name,
      weightKg: weight,
      pricePerKg,
      total: itemTotal,
    });

    toast({
      title: "Item adicionado",
      description: `${selectedProduct!.name}: ${weight.toFixed(3)}kg = R$ ${itemTotal.toFixed(2).replace(".", ",")}`,
    });

    setManualWeight("");
    setSimulatedWeight(0);
  };

  const handleClose = () => {
    setSelectedProductId("");
    setManualWeight("");
    setSimulatedWeight(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Venda por Peso
          </DialogTitle>
          <DialogDescription>
            Selecione o produto e capture o peso da balança
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connected ? (
                <Badge variant="default" className="gap-1">
                  <Wifi className="h-3 w-3" />
                  {simulatedMode ? "Modo Simulado" : "Balança Conectada"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  Desconectado
                </Badge>
              )}
              {connected && !simulatedMode && !isStable && (
                <Badge variant="outline" className="gap-1 text-yellow-600">
                  <AlertCircle className="h-3 w-3" />
                  Instável
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={connected ? disconnect : connect}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {scaleError && (
            <p className="text-xs text-destructive">{scaleError}</p>
          )}

          {/* Product Selection */}
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto..." />
              </SelectTrigger>
              <SelectContent>
                {weightProducts.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum produto configurado para venda por peso
                  </div>
                ) : (
                  weightProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - R$ {product.price_per_kg?.toFixed(2).replace(".", ",")}/kg
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Weight Display */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Peso Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <span className={`text-4xl font-bold font-mono ${!isStable && !simulatedMode ? "text-yellow-500 animate-pulse" : ""}`}>
                  {currentWeightKg.toFixed(3)}
                </span>
                <span className="text-xl text-muted-foreground ml-1">kg</span>
              </div>
            </CardContent>
          </Card>

          {/* Manual Weight Input (for simulated mode) */}
          {simulatedMode && (
            <div className="space-y-2">
              <Label htmlFor="manual-weight">Peso Manual (kg)</Label>
              <Input
                id="manual-weight"
                type="text"
                inputMode="decimal"
                placeholder="0,000"
                value={manualWeight}
                onChange={(e) => handleManualWeightChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Modo simulado: digite o peso manualmente para testes
              </p>
            </div>
          )}

          {/* Price Calculation */}
          {selectedProduct && currentWeightKg > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço/kg:</span>
                    <span>R$ {pricePerKg.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peso:</span>
                    <span>{currentWeightKg.toFixed(3)} kg</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-primary">
                      R$ {total.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          <Button
            onClick={handleCapture}
            disabled={!selectedProductId || currentWeightKg <= 0 || (!simulatedMode && !isStable)}
          >
            <Scale className="h-4 w-4 mr-1" />
            {!simulatedMode && !isStable ? "Aguardando estabilizar..." : "Adicionar Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
