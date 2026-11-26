import { useState } from "react";
import { CreditCard, Loader2, Printer, Smartphone, Banknote } from "lucide-react";
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
import type { PaymentMethodType } from "@/types/cashRegister";
import { PAYMENT_METHOD_CONFIG } from "@/types/cashRegister";
import { printOrderReceipt } from "@/lib/printUtils";

interface PaymentProcessorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderTotal: number;
  orderData?: {
    id: string;
    items: any[];
    subtotal: number;
    total: number;
    delivery_fee: number;
    guest_name?: string | null;
  };
  onProcess: (
    orderId: string,
    paymentMethod: PaymentMethodType,
    amount: number
  ) => Promise<{ error: Error | null; drawerOpened: boolean; requiresTerminal?: boolean }>;
  onComplete: () => void;
}

export function PaymentProcessor({
  open,
  onOpenChange,
  orderId,
  orderTotal,
  orderData,
  onProcess,
  onComplete,
}: PaymentProcessorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [loading, setLoading] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState<"idle" | "waiting" | "approved" | "denied">("idle");
  const { toast } = useToast();

  const formatPrice = (price: number) =>
    `R$ ${price.toFixed(2).replace(".", ",")}`;

  const cashAmount = parseFloat(cashReceived.replace(",", ".")) || 0;
  const change = cashAmount - orderTotal;

  const handleMethodSelect = (method: PaymentMethodType) => {
    setSelectedMethod(method);
    setTerminalStatus("idle");
    setCashReceived("");
  };

  const handleProcess = async () => {
    if (!selectedMethod) return;

    setLoading(true);
    const config = PAYMENT_METHOD_CONFIG[selectedMethod];

    // Simulate terminal integration for card payments
    if (config.requiresTerminal) {
      setTerminalStatus("waiting");
      
      // Simulate terminal response (2-3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      // Simulate 95% approval rate
      const approved = Math.random() > 0.05;
      setTerminalStatus(approved ? "approved" : "denied");
      
      if (!approved) {
        setLoading(false);
        toast({
          title: "Pagamento recusado",
          description: "Tente outro cartão ou forma de pagamento",
          variant: "destructive",
        });
        return;
      }
      
      // Wait a bit to show approved status
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const { error, drawerOpened } = await onProcess(orderId, selectedMethod, orderTotal);

    if (error) {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Auto-print receipt on cashier printer
      if (orderData && selectedMethod) {
        printOrderReceipt(orderData, selectedMethod);
      }
      toast({
        title: "Pagamento registrado",
        description: drawerOpened
          ? "Gaveta aberta - entregue o troco"
          : `Pagamento via ${config.label} confirmado`,
      });
      onComplete();
      onOpenChange(false);
      resetState();
    }
    setLoading(false);
  };

  const resetState = () => {
    setSelectedMethod(null);
    setCashReceived("");
    setTerminalStatus("idle");
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      resetState();
    }
  };

  const canProcess =
    selectedMethod &&
    (selectedMethod !== "cash" || cashAmount >= orderTotal) &&
    terminalStatus !== "waiting";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Processar Pagamento</DialogTitle>
          <DialogDescription>
            Total: <span className="font-bold text-foreground">{formatPrice(orderTotal)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Method Selection */}
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(PAYMENT_METHOD_CONFIG) as [PaymentMethodType, typeof PAYMENT_METHOD_CONFIG[PaymentMethodType]][]).map(
              ([method, config]) => (
                <Button
                  key={method}
                  type="button"
                  variant={selectedMethod === method ? "default" : "outline"}
                  className="h-16 flex-col gap-1"
                  onClick={() => handleMethodSelect(method)}
                  disabled={loading}
                >
                  <span className="text-xl">{config.icon}</span>
                  <span className="text-xs">{config.label}</span>
                </Button>
              )
            )}
          </div>

          {/* Cash specific: amount received */}
          {selectedMethod === "cash" && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="cash-received">Valor Recebido (R$)</Label>
                <Input
                  id="cash-received"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  autoFocus
                />
              </div>
              {cashAmount >= orderTotal && (
                <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
                  <span className="text-sm">Troco:</span>
                  <span className="font-bold text-primary">{formatPrice(change)}</span>
                </div>
              )}
              {cashAmount > 0 && cashAmount < orderTotal && (
                <p className="text-sm text-destructive">
                  Valor insuficiente. Faltam {formatPrice(orderTotal - cashAmount)}
                </p>
              )}
            </div>
          )}

          {/* Card terminal simulation */}
          {selectedMethod && PAYMENT_METHOD_CONFIG[selectedMethod].requiresTerminal && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                <span className="font-medium">Maquininha de Cartão</span>
              </div>
              
              {terminalStatus === "idle" && (
                <p className="text-sm text-muted-foreground">
                  Clique em "Processar" para enviar à maquininha
                </p>
              )}
              {terminalStatus === "waiting" && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Aguardando aprovação...</span>
                </div>
              )}
              {terminalStatus === "approved" && (
                <p className="text-sm text-green-600">✓ Pagamento aprovado!</p>
              )}
              {terminalStatus === "denied" && (
                <p className="text-sm text-destructive">✗ Pagamento recusado</p>
              )}
            </div>
          )}

          {/* Drawer indicator */}
          {selectedMethod === "cash" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Banknote className="h-4 w-4" />
              <span>A gaveta será aberta automaticamente</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleProcess} disabled={!canProcess || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              "Processar Pagamento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
