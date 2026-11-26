import { useState } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useClosedDates } from "@/hooks/useClosedDates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

export function ClosedDatesManager() {
  const { closedDates, loading, addClosedDate, removeClosedDate } = useClosedDates();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!dateRange?.from) {
      toast({ title: "Selecione ao menos uma data", variant: "destructive" });
      return;
    }
    setSaving(true);
    const start = dateRange.from;
    const end = dateRange.to || dateRange.from;
    const { error } = await addClosedDate(start, end, reason);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Datas bloqueadas salvas!" });
      setDialogOpen(false);
      setDateRange(undefined);
      setReason("");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await removeClosedDate(id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    }
  };

  const today = startOfDay(new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CalendarOff className="h-5 w-5" />
          Fechado / Férias
        </h3>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Bloqueio
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : closedDates.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma data bloqueada cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {closedDates.map((cd) => {
            const start = parseISO(cd.date_start);
            const end = parseISO(cd.date_end);
            const isPast = isBefore(end, today);
            const sameDay = cd.date_start === cd.date_end;
            return (
              <div
                key={cd.id}
                className={cn(
                  "flex items-center justify-between border rounded-lg p-3 bg-card",
                  isPast && "opacity-50"
                )}
              >
                <div>
                  <p className="font-medium">
                    {sameDay
                      ? format(start, "dd/MM/yyyy", { locale: ptBR })
                      : `${format(start, "dd/MM/yyyy", { locale: ptBR })} → ${format(end, "dd/MM/yyyy", { locale: ptBR })}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{cd.reason}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(cd.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear Datas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <p className="text-xs text-muted-foreground">Selecione uma data ou um intervalo</p>
              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  disabled={(date) => isBefore(date, today)}
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
                />
              </div>
              {dateRange?.from && (
                <p className="text-sm text-center text-muted-foreground">
                  {dateRange.to && dateRange.from.getTime() !== dateRange.to.getTime()
                    ? `${format(dateRange.from, "dd/MM/yyyy")} → ${format(dateRange.to, "dd/MM/yyyy")}`
                    : format(dateRange.from, "dd/MM/yyyy")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ex: Feriado, Férias, Manutenção..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !dateRange?.from}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
