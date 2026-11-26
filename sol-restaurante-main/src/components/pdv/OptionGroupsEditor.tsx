import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EditorOption {
  id?: string;
  name: string;
  price_delta: number;
  is_active: boolean;
  display_order: number;
}

export interface EditorGroup {
  id?: string;
  name: string;
  required: boolean;
  min_select: number;
  max_select: number;
  display_order: number;
  options: EditorOption[];
}

interface Props {
  productId?: string | null;
  onChange?: (groups: EditorGroup[]) => void;
}

export function OptionGroupsEditor({ productId, onChange }: Props) {
  const [groups, setGroups] = useState<EditorGroup[]>([]);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!productId) {
      setGroups([]);
      return;
    }
    void loadGroups(productId);
  }, [productId]);

  useEffect(() => {
    onChange?.(groups);
  }, [groups, onChange]);

  const loadGroups = async (pid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("option_groups")
      .select("*, options(*)")
      .eq("product_id", pid)
      .order("display_order");
    if (error) {
      toast({ title: "Erro ao carregar complementos", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setGroups(
      (data || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        required: g.required,
        min_select: g.min_select,
        max_select: g.max_select,
        display_order: g.display_order,
        options: (g.options || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((o: any) => ({
            id: o.id,
            name: o.name,
            price_delta: Number(o.price_delta),
            is_active: o.is_active,
            display_order: o.display_order,
          })),
      })),
    );
    setLoading(false);
  };

  const addGroup = () => {
    setGroups((prev) => {
      const next = [
        ...prev,
        {
          name: "",
          required: false,
          min_select: 0,
          max_select: 1,
          display_order: prev.length,
          options: [],
        },
      ];
      setExpanded(next.length - 1);
      return next;
    });
  };

  const removeGroup = (idx: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateGroup = (idx: number, patch: Partial<EditorGroup>) => {
    setGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  };

  const addOption = (gIdx: number) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gIdx
          ? {
              ...g,
              options: [
                ...g.options,
                { name: "", price_delta: 0, is_active: true, display_order: g.options.length },
              ],
            }
          : g,
      ),
    );
  };

  const removeOption = (gIdx: number, oIdx: number) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gIdx ? { ...g, options: g.options.filter((_, j) => j !== oIdx) } : g,
      ),
    );
  };

  const updateOption = (gIdx: number, oIdx: number, patch: Partial<EditorOption>) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gIdx
          ? { ...g, options: g.options.map((o, j) => (j === oIdx ? { ...o, ...patch } : o)) }
          : g,
      ),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">🧩 Complementos</Label>
          <p className="text-xs text-muted-foreground">
            Grupos como "Escolha o acompanhamento" ou "Adicionais"
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addGroup}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Grupo
        </Button>
      </div>

      {loading && <p className="text-xs text-muted-foreground">Carregando…</p>}

      {groups.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground italic px-1">
          Nenhum complemento. Clique em "Grupo" para criar.
        </p>
      )}

      {groups.map((group, gIdx) => (
        <Card key={gIdx} className="border-dashed">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Nome do grupo (ex.: Escolha o acompanhamento)"
                value={group.name}
                onChange={(e) => updateGroup(gIdx, { name: e.target.value })}
                className="h-8 text-sm flex-1"
              />
              <Badge variant="secondary" className="text-[10px]">
                {group.options.length} opç
              </Badge>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setExpanded(expanded === gIdx ? null : gIdx)}
              >
                {expanded === gIdx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => removeGroup(gIdx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {expanded === gIdx && (
              <>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="flex items-center gap-2 col-span-1">
                    <Switch
                      checked={group.required}
                      onCheckedChange={(v) => updateGroup(gIdx, { required: v })}
                      id={`req-${gIdx}`}
                    />
                    <Label htmlFor={`req-${gIdx}`} className="text-xs">
                      Obrigatório
                    </Label>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Mín</Label>
                    <Input
                      type="number"
                      min={0}
                      value={group.min_select}
                      onChange={(e) =>
                        updateGroup(gIdx, { min_select: parseInt(e.target.value || "0") })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Máx</Label>
                    <Input
                      type="number"
                      min={1}
                      value={group.max_select}
                      onChange={(e) =>
                        updateGroup(gIdx, { max_select: parseInt(e.target.value || "1") })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pl-2 border-l-2 border-muted">
                  {group.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <Input
                        placeholder="Opção (ex.: Arroz branco)"
                        value={opt.name}
                        onChange={(e) => updateOption(gIdx, oIdx, { name: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="+0,00"
                        value={opt.price_delta === 0 ? "" : String(opt.price_delta).replace(".", ",")}
                        onChange={(e) =>
                          updateOption(gIdx, oIdx, {
                            price_delta: parseFloat(e.target.value.replace(",", ".")) || 0,
                          })
                        }
                        className="h-8 text-sm w-20"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeOption(gIdx, oIdx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => addOption(gIdx)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Opção
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Persists groups + options for a product (deletes removed, upserts kept/new). */
export async function saveOptionGroups(productId: string, groups: EditorGroup[]) {
  // Fetch existing IDs to compute deletions
  const { data: existingGroups } = await supabase
    .from("option_groups")
    .select("id, options(id)")
    .eq("product_id", productId);

  const existingGroupIds = new Set((existingGroups || []).map((g: any) => g.id));
  const keptGroupIds = new Set(groups.filter((g) => g.id).map((g) => g.id!));
  const toDeleteGroupIds = [...existingGroupIds].filter((id) => !keptGroupIds.has(id));

  if (toDeleteGroupIds.length > 0) {
    await supabase.from("option_groups").delete().in("id", toDeleteGroupIds);
  }

  for (let gIdx = 0; gIdx < groups.length; gIdx++) {
    const g = groups[gIdx];
    let groupId = g.id;

    if (groupId) {
      await supabase
        .from("option_groups")
        .update({
          name: g.name,
          required: g.required,
          min_select: g.min_select,
          max_select: g.max_select,
          display_order: gIdx,
        })
        .eq("id", groupId);
    } else {
      const { data: newG, error } = await supabase
        .from("option_groups")
        .insert({
          product_id: productId,
          name: g.name,
          required: g.required,
          min_select: g.min_select,
          max_select: g.max_select,
          display_order: gIdx,
        })
        .select("id")
        .single();
      if (error || !newG) continue;
      groupId = newG.id;
    }

    // Options diff
    const existingForGroup =
      (existingGroups || []).find((x: any) => x.id === groupId)?.options || [];
    const existingOptIds = new Set(existingForGroup.map((o: any) => o.id));
    const keptOptIds = new Set(g.options.filter((o) => o.id).map((o) => o.id!));
    const toDeleteOptIds = [...existingOptIds].filter((id) => !keptOptIds.has(id as string));
    if (toDeleteOptIds.length > 0) {
      await supabase.from("options").delete().in("id", toDeleteOptIds);
    }

    for (let oIdx = 0; oIdx < g.options.length; oIdx++) {
      const o = g.options[oIdx];
      if (o.id) {
        await supabase
          .from("options")
          .update({
            name: o.name,
            price_delta: o.price_delta,
            is_active: o.is_active,
            display_order: oIdx,
          })
          .eq("id", o.id);
      } else {
        await supabase.from("options").insert({
          group_id: groupId!,
          name: o.name,
          price_delta: o.price_delta,
          is_active: o.is_active,
          display_order: oIdx,
        });
      }
    }
  }
}
