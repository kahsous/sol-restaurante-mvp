import { Volume2, VolumeX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSoundAlerts } from "@/hooks/useSoundAlerts";
import { useToast } from "@/hooks/use-toast";

const ALERT_LABELS: Record<string, { label: string; description: string }> = {
  new_online_order: { label: "Novo Pedido Online", description: "Alerta sonoro ao receber um novo pedido via site" },
  new_tab_opened: { label: "Nova Comanda Aberta", description: "Som ao abrir uma nova comanda no PDV" },
  item_to_kitchen: { label: "Item para Cozinha", description: "Som ao enviar item para preparo na cozinha" },
};

export function SoundAlertConfig() {
  const { configs, playSound, toggleAlert } = useSoundAlerts();
  const { toast } = useToast();

  const handleToggle = async (key: string, enabled: boolean) => {
    const { error } = await toggleAlert(key, enabled);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleTest = (key: string) => {
    playSound(key as any);
    toast({ title: "🔊 Som de teste", description: ALERT_LABELS[key]?.label || key });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Volume2 className="h-5 w-5" /> Alertas Sonoros
      </h3>
      <div className="space-y-3">
        {configs.map((config) => {
          const meta = ALERT_LABELS[config.key];
          if (!meta) return null;
          return (
            <Card key={config.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {config.enabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                    <Label className="font-medium">{meta.label}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-6">{meta.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleTest(config.key)}>
                    Testar
                  </Button>
                  <Switch checked={config.enabled} onCheckedChange={(v) => handleToggle(config.key, v)} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
