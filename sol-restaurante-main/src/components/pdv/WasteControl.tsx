import { useState, useEffect } from "react";
import { Trash2, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types/product";

const REASONS = [
  { value: "expired", label: "Alimento Vencido" },
  { value: "prep_error", label: "Erro de Preparo" },
  { value: "buffet_leftover", label: "Sobra Buffet" },
  { value: "discard", label: "Descarte" },
  { value: "other", label: "Outro" },
];

interface WasteEntry {
  id: string;
  product_id: string | null;
  quantity: number;
  unit: string;
  reason: string;
  notes: string | null;
  responsible: string | null;
  created_at: string;
  product?: { name: string } | null;
}

export function WasteControl({ products }: { products: Product[] }) {
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("un");
  const [reason, setReason] = useState("other");
  const [notes, setNotes] = useState("");
  const [responsible, setResponsible] = useState("");
  const { toast } = useToast();

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("waste_control")
      .select("*, product:products(name)")
      .order("created_at", { ascending: false })
      .limit(100);
    setEntries((data || []) as WasteEntry[]);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleCreate = async () => {
    if (!quantity) return;
    const { error } = await supabase.from("waste_control").insert({
      product_id: productId || null,
      quantity: parseFloat(quantity),
      unit,
      reason,
      notes: notes || null,
      responsible: responsible || null,
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registro de desperdício salvo" });
      setDialogOpen(false);
      setProductId(""); setQuantity(""); setNotes(""); setResponsible("");
      fetchEntries();
    }
  };

  const totalWaste = entries.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> Controle de Desperdício
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Registrar Perda</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Desperdício</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Produto (opcional)" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Quantidade" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">un</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Motivo" /></SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Responsável" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
              <Textarea placeholder="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button onClick={handleCreate} className="w-full">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Registros de Desperdício ({totalWaste})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum registro encontrado</p>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{e.product?.name || "Produto não especificado"}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.quantity} {e.unit} • {REASONS.find(r => r.value === e.reason)?.label || e.reason}
                      {e.responsible && ` • ${e.responsible}`}
                    </p>
                    {e.notes && <p className="text-xs text-muted-foreground italic">{e.notes}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
