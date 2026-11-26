import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onCancelled?: () => void;
}

const REASONS = [
  "Pedido em duplicidade",
  "Cliente desistiu",
  "Item indisponível",
  "Restaurante fechado",
  "Problemas na cozinha",
  "Sem entregador disponível",
  "Outro motivo",
];

export function CancelOrderDialog({ open, onOpenChange, orderId, onCancelled }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected("");
    setNote("");
  }, [open]);

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const reason = note ? `${selected} — ${note}` : selected;
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled", notes: `[CANCELADO] ${reason}` })
        .eq("id", orderId);
      if (error) throw error;
      toast.success("Pedido cancelado");
      onCancelled?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Erro ao cancelar: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar pedido</DialogTitle>
          <DialogDescription>Informe o motivo do cancelamento.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Motivo</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger><SelectValue placeholder="Escolha um motivo" /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Observação (opcional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Voltar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!selected || submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Confirmar cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
