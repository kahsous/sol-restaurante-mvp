import { useState, forwardRef } from "react";
import { DollarSign, Loader2 } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface CashRegisterOpenProps {
  onOpen: (openingBalance: number) => Promise<{ error: Error | null }>;
  disabled?: boolean;
}

export const CashRegisterOpen = forwardRef<HTMLDivElement, CashRegisterOpenProps>(function CashRegisterOpen({ onOpen, disabled }, ref) {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const amount = parseFloat(balance.replace(",", ".")) || 0;
    const { error } = await onOpen(amount);

    if (error) {
      toast({
        title: "Erro ao abrir caixa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Caixa aberto",
        description: `Saldo inicial: R$ ${amount.toFixed(2).replace(".", ",")}`,
      });
      setOpen(false);
      setBalance("");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2" disabled={disabled}>
          <DollarSign className="h-5 w-5" />
          Abrir Caixa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir Caixa</DialogTitle>
          <DialogDescription>
            Informe o valor inicial em dinheiro (troco) para iniciar o turno.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="opening-balance">Valor Inicial em Dinheiro (R$)</Label>
              <Input
                id="opening-balance"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Abrir Caixa"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
