import { useState } from "react";
import { Lock, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { PaymentMethodType } from "@/types/cashRegister";
import { PAYMENT_METHOD_CONFIG } from "@/types/cashRegister";
import { printCashCloseReport } from "@/lib/printUtils";

interface CashRegisterCloseProps {
  openingBalance: number;
  expectedCash: number;
  registerId: string;
  operatorEmail: string;
  totals: {
    totalSales: number;
    withdrawals: number;
    deposits: number;
    byMethod: Record<PaymentMethodType, number>;
  };
  onClose: (closingBalance: number, notes?: string) => Promise<{ error: Error | null; difference?: number }>;
}

export function CashRegisterClose({ openingBalance, expectedCash, registerId, operatorEmail, totals, onClose }: CashRegisterCloseProps) {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatPrice = (price: number) =>
    `R$ ${price.toFixed(2).replace(".", ",")}`;

  const closingAmount = parseFloat(balance.replace(",", ".")) || 0;
  const difference = closingAmount - expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!balance.trim()) {
      toast({
        title: "Valor obrigatório",
        description: "Informe o valor contado em dinheiro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error, difference: diff } = await onClose(closingAmount, notes || undefined);

    if (error) {
      toast({
        title: "Erro ao fechar caixa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Auto-print cash close report
      printCashCloseReport({
        operatorEmail,
        openingBalance,
        closingBalance: closingAmount,
        expectedCash,
        totals: { ...totals, byMethod: totals.byMethod as Record<string, number> },
        registerId,
      });

      toast({
        title: "Caixa fechado com sucesso",
        description: diff !== undefined && diff !== 0
          ? `Diferença de ${formatPrice(Math.abs(diff))} ${diff > 0 ? "(sobra)" : "(quebra)"}`
          : "Caixa conferido sem diferenças!",
      });
      setOpen(false);
      setBalance("");
      setNotes("");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Lock className="h-4 w-4" />
          Fechar Caixa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechamento de Caixa</DialogTitle>
          <DialogDescription>
            Confira o resumo financeiro e informe o valor contado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Opening Balance */}
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Saldo Inicial</span>
              <span className="font-semibold">{formatPrice(openingBalance)}</span>
            </div>

            <Separator />

            {/* Sales by Payment Method */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Vendas por Forma de Pagamento</h4>
              <div className="space-y-1">
                {(Object.entries(PAYMENT_METHOD_CONFIG) as [PaymentMethodType, typeof PAYMENT_METHOD_CONFIG[PaymentMethodType]][]).map(
                  ([method, config]) => {
                    const value = totals.byMethod[method] || 0;
                    return (
                      <div key={method} className="flex justify-between items-center px-3 py-1.5 text-sm">
                        <span className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          {config.label}
                        </span>
                        <span className={value > 0 ? "font-medium text-green-600" : "text-muted-foreground"}>
                          {formatPrice(value)}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
              <div className="flex justify-between items-center px-3 py-2 bg-green-50 dark:bg-green-950/30 rounded mt-1">
                <span className="text-sm font-semibold">Total de Vendas</span>
                <span className="font-bold text-green-600">{formatPrice(totals.totalSales)}</span>
              </div>
            </div>

            <Separator />

            {/* Withdrawals and Deposits */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-3 py-1.5 text-sm">
                <span>Sangrias</span>
                <span className={totals.withdrawals > 0 ? "font-medium text-destructive" : "text-muted-foreground"}>
                  - {formatPrice(totals.withdrawals)}
                </span>
              </div>
              <div className="flex justify-between items-center px-3 py-1.5 text-sm">
                <span>Suprimentos</span>
                <span className={totals.deposits > 0 ? "font-medium text-green-600" : "text-muted-foreground"}>
                  + {formatPrice(totals.deposits)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Expected Cash */}
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Saldo Esperado em Dinheiro</span>
                <span className="text-xl font-bold">{formatPrice(expectedCash)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Inicial + Vendas em dinheiro + Suprimentos - Sangrias
              </p>
            </div>

            {/* Cash Counted */}
            <div className="space-y-2">
              <Label htmlFor="closing-balance">Valor Contado em Dinheiro (R$) *</Label>
              <Input
                id="closing-balance"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                autoFocus
              />
            </div>

            {/* Difference indicator */}
            {balance && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  difference === 0
                    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                }`}
              >
                {difference === 0 ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Caixa conferido — sem diferenças!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5" />
                    <span>
                      {difference > 0 ? "Sobra" : "Quebra"} de{" "}
                      <strong>{formatPrice(Math.abs(difference))}</strong>
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Justificativa de diferença, ocorrências do turno, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !balance}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar Fechamento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
