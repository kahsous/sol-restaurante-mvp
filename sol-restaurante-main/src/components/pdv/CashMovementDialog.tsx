import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { MovementType } from "@/types/cashRegister";

interface CashMovementDialogProps {
  type: "withdrawal" | "deposit";
  onSubmit: (type: MovementType, amount: number, description?: string) => Promise<{ error: Error | null }>;
}

const CONFIG = {
  withdrawal: {
    title: "Registrar Sangria",
    description: "Retire dinheiro do caixa e registre o motivo.",
    buttonLabel: "Sangria",
    icon: ArrowDownCircle,
    iconColor: "text-destructive",
    submitLabel: "Registrar Sangria",
  },
  deposit: {
    title: "Registrar Suprimento",
    description: "Adicione dinheiro ao caixa e registre o motivo.",
    buttonLabel: "Suprimento",
    icon: ArrowUpCircle,
    iconColor: "text-green-600",
    submitLabel: "Registrar Suprimento",
  },
};

export function CashMovementDialog({ type, onSubmit }: CashMovementDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const config = CONFIG[type];
  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = parseFloat(amount.replace(",", ".")) || 0;
    if (value <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da movimentação.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await onSubmit(type, value, description.trim());

    if (error) {
      toast({
        title: `Erro ao registrar ${type === "withdrawal" ? "sangria" : "suprimento"}`,
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: `${type === "withdrawal" ? "Sangria" : "Suprimento"} registrado`,
        description: `R$ ${value.toFixed(2).replace(".", ",")} - ${description.trim()}`,
      });
      setOpen(false);
      setAmount("");
      setDescription("");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
          {config.buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={`${type}-amount`}>Valor (R$) *</Label>
              <Input
                id={`${type}-amount`}
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${type}-description`}>Motivo *</Label>
              <Textarea
                id={`${type}-description`}
                placeholder={
                  type === "withdrawal"
                    ? "Ex: Pagamento de fornecedor, troco para outro caixa..."
                    : "Ex: Reforço de troco, devolução..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                config.submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
