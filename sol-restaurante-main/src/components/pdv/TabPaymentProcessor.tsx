import { useState } from "react";
import { CreditCard, Loader2, Smartphone, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { PaymentMethodType } from "@/types/cashRegister";
import { PAYMENT_METHOD_CONFIG } from "@/types/cashRegister";
import type { Tab } from "@/types/tab";
import { printReceipt } from "@/lib/printUtils";

interface TabPaymentProcessorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: Tab;
  onProcess: (
    orderId: string,
    paymentMethod: PaymentMethodType,
    amount: number
  ) => Promise<{ error: Error | null; drawerOpened: boolean; requiresTerminal?: boolean }>;
  onComplete: () => void;
}

export function TabPaymentProcessor({ open, onOpenChange, tab, onProcess, onComplete }: TabPaymentProcessorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [loading, setLoading] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState<"idle" | "waiting" | "approved" | "denied">("idle");
  const { toast } = useToast();

  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace(".", ",")}`;
  const cashAmount = parseFloat(cashReceived.replace(",", ".")) || 0;
  const change = cashAmount - tab.subtotal;

  const handleProcess = async () => {
    if (!selectedMethod) return;
    setLoading(true);
    const config = PAYMENT_METHOD_CONFIG[selectedMethod];

    if (config.requiresTerminal) {
      setTerminalStatus("waiting");
      await new Promise((r) => setTimeout(r, 2500));
      const approved = Math.random() > 0.05;
      setTerminalStatus(approved ? "approved" : "denied");
      if (!approved) {
        setLoading(false);
        toast({ title: "Pagamento recusado", description: "Tente outro cartão", variant: "destructive" });
        return;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Use tab.id as orderId for cash movement tracking
    const { error, drawerOpened } = await onProcess(tab.id, selectedMethod, tab.subtotal);

    if (error) {
      toast({ title: "Erro ao processar pagamento", description: error.message, variant: "destructive" });
    } else {
      // Print receipt
      printReceipt(tab.tab_number, tab.items, tab.subtotal, selectedMethod, tab.customer_name);

      toast({
        title: `Comanda ${tab.code} paga`,
        description: drawerOpened ? "Gaveta aberta - entregue o troco" : `Pagamento via ${config.label} confirmado`,
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

  const canProcess = selectedMethod && (selectedMethod !== "cash" || cashAmount >= tab.subtotal) && terminalStatus !== "waiting";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!loading) { onOpenChange(o); if (!o) resetState(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento - Comanda {tab.code}</DialogTitle>
          <DialogDescription>
            {tab.customer_name && <span className="block">Cliente: {tab.customer_name}</span>}
            Total: <span className="font-bold text-foreground">{formatPrice(tab.subtotal)}</span>
            <span className="block text-xs">{tab.items.length} item(s)</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(PAYMENT_METHOD_CONFIG) as [PaymentMethodType, typeof PAYMENT_METHOD_CONFIG[PaymentMethodType]][]).map(
              ([method, config]) => (
                <Button key={method} type="button" variant={selectedMethod === method ? "default" : "outline"}
                  className="h-16 flex-col gap-1" onClick={() => { setSelectedMethod(method); setTerminalStatus("idle"); setCashReceived(""); }}
                  disabled={loading}>
                  <span className="text-xl">{config.icon}</span>
                  <span className="text-xs">{config.label}</span>
                </Button>
              )
            )}
          </div>

          {selectedMethod === "cash" && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label>Valor Recebido (R$)</Label>
                <Input type="text" inputMode="decimal" placeholder="0,00" value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)} autoFocus />
              </div>
              {cashAmount >= tab.subtotal && (
                <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
                  <span className="text-sm">Troco:</span>
                  <span className="font-bold text-primary">{formatPrice(change)}</span>
                </div>
              )}
              {cashAmount > 0 && cashAmount < tab.subtotal && (
                <p className="text-sm text-destructive">Valor insuficiente. Faltam {formatPrice(tab.subtotal - cashAmount)}</p>
              )}
            </div>
          )}

          {selectedMethod && PAYMENT_METHOD_CONFIG[selectedMethod].requiresTerminal && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2"><Smartphone className="h-5 w-5" /><span className="font-medium">Maquininha de Cartão</span></div>
              {terminalStatus === "idle" && <p className="text-sm text-muted-foreground">Clique em "Processar" para enviar à maquininha</p>}
              {terminalStatus === "waiting" && <div className="flex items-center gap-2 text-primary"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Aguardando aprovação...</span></div>}
              {terminalStatus === "approved" && <p className="text-sm text-green-600">✓ Pagamento aprovado!</p>}
              {terminalStatus === "denied" && <p className="text-sm text-destructive">✗ Pagamento recusado</p>}
            </div>
          )}

          {selectedMethod === "cash" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Banknote className="h-4 w-4" /><span>A gaveta será aberta automaticamente</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetState(); }} disabled={loading}>Cancelar</Button>
          <Button onClick={handleProcess} disabled={!canProcess || loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processando...</> : "Processar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
