import { useState, useEffect, useCallback } from "react";
import { Printer, Scale, Wifi, Usb, TestTube, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useScale } from "@/hooks/useScale";
import type { PrinterConfig } from "@/types/product";

const PRINTER_MODELS = [
  { value: "elgin_i8", label: "Elgin i8" },
  { value: "elgin_i9", label: "Elgin i9" },
  { value: "epson_tm20", label: "Epson TM-T20" },
  { value: "bematech_mp4200", label: "Bematech MP-4200" },
  { value: "generic_escpos", label: "Genérica ESC/POS" },
];

const SCALE_MODELS = [
  { value: "toledo", label: "Toledo (Prix 3, Prix 4, Prix 5)", description: "Protocolo STX/ETX, polling ENQ" },
  { value: "filizola", label: "Filizola (Platina, CS, BP)", description: "Protocolo Filizola padrão, polling ENQ" },
  { value: "urano", label: "Urano (POP-S, TOP Max, USE)", description: "Transmissão contínua automática" },
];

const BAUD_RATES_BY_PROTOCOL: Record<string, number> = {
  toledo: 9600,
  filizola: 4800,
  urano: 9600,
};

const CONNECTION_TYPES = [
  { value: "usb", label: "USB", icon: Usb },
  { value: "network", label: "Rede (IP)", icon: Wifi },
];

export function PrinterScaleConfig() {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { 
    config: scaleConfig, 
    updateConfig: updateScaleConfig, 
    connect, 
    disconnect,
    connected, 
    simulatedMode, 
    webSerialSupported,
    error: scaleError,
    currentWeight,
  } = useScale();

  const fetchPrinters = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("printer_config")
      .select("*")
      .order("name");

    if (!error) setPrinters((data || []) as PrinterConfig[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPrinters(); }, [fetchPrinters]);

  const updatePrinter = async (id: string, updates: Partial<PrinterConfig>) => {
    setSaving(true);
    const { error } = await supabase.from("printer_config").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      setPrinters(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      toast({ title: "Configuração salva" });
    }
    setSaving(false);
  };

  const testPrint = (printer: PrinterConfig) => {
    const win = window.open("", "_blank", "width=300,height=400");
    if (win) {
      win.document.write(`
        <html><head><title>Teste ${printer.name}</title>
        <style>body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:10px}
        .center{text-align:center}.line{border-top:1px dashed #000;margin:8px 0}</style></head>
        <body>
          <div class="center"><strong>TESTE DE IMPRESSÃO</strong></div>
          <div class="line"></div>
          <p>Impressora: ${printer.name}</p>
          <p>Modelo: ${PRINTER_MODELS.find(m => m.value === printer.model)?.label || printer.model}</p>
          <p>Conexão: ${printer.connection_type}</p>
          <p>Data: ${new Date().toLocaleString("pt-BR")}</p>
          <div class="line"></div>
          <div class="center">✓ Impressão funcionando!</div>
        </body></html>
      `);
      win.document.close();
      win.print();
    }
    toast({ title: "Teste enviado", description: `Teste de impressão para ${printer.name}` });
  };

  const handleProtocolChange = async (protocol: string) => {
    const defaultBaud = BAUD_RATES_BY_PROTOCOL[protocol] || 9600;
    await updateScaleConfig({ protocol: protocol as any, baud_rate: defaultBaud });
  };

  const testScale = async () => {
    if (connected) {
      await disconnect();
      toast({ title: "Balança desconectada" });
      return;
    }
    
    const ok = await connect();
    if (ok) {
      toast({ 
        title: "Balança conectada", 
        description: simulatedMode 
          ? "Modo simulado ativo (Web Serial não disponível ou não HTTPS)" 
          : `Protocolo ${scaleConfig?.protocol?.toUpperCase()} — leitura ativa` 
      });
    } else {
      toast({ title: "Erro de conexão", description: scaleError || "Não foi possível conectar à balança", variant: "destructive" });
    }
  };

  const selectedScaleModel = SCALE_MODELS.find(m => m.value === (scaleConfig?.protocol || "toledo"));

  return (
    <div className="space-y-6">
      {/* Printers */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Printer className="h-5 w-5" /> Impressoras Térmicas
        </h3>
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {printers.map((printer) => (
              <Card key={printer.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{printer.name}</CardTitle>
                    <Badge variant={printer.is_active ? "default" : "secondary"}>
                      {printer.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {PRINTER_MODELS.find(m => m.value === printer.model)?.label || printer.model}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={printer.name} onChange={(e) => updatePrinter(printer.id, { name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Select value={printer.model} onValueChange={(v) => updatePrinter(printer.id, { model: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRINTER_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Conexão</Label>
                    <Select value={printer.connection_type} onValueChange={(v) => updatePrinter(printer.id, { connection_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONNECTION_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {printer.connection_type === "network" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>IP</Label>
                        <Input placeholder="192.168.1.100" value={printer.address || ""} onChange={(e) => updatePrinter(printer.id, { address: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Porta</Label>
                        <Input type="number" placeholder="9100" value={printer.port || ""} onChange={(e) => updatePrinter(printer.id, { port: parseInt(e.target.value) || null })} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Label>Ticket Cozinha</Label>
                    <Switch checked={printer.print_kitchen_ticket} onCheckedChange={(v) => updatePrinter(printer.id, { print_kitchen_ticket: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Recibo Caixa</Label>
                    <Switch checked={printer.print_receipt} onCheckedChange={(v) => updatePrinter(printer.id, { print_receipt: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Ativa</Label>
                    <Switch checked={printer.is_active} onCheckedChange={(v) => updatePrinter(printer.id, { is_active: v })} />
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => testPrint(printer)}>
                    <TestTube className="h-4 w-4 mr-1" /> Teste de Impressão
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Scale */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Scale className="h-5 w-5" /> Balança
        </h3>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{scaleConfig?.name || "Balança Principal"}</CardTitle>
              <div className="flex items-center gap-2">
                {connected && currentWeight && (
                  <Badge variant="outline" className="font-mono text-sm">
                    {currentWeight.weight_kg.toFixed(3)} kg
                    {currentWeight.stable ? " ✓" : " ~"}
                  </Badge>
                )}
                <Badge variant={connected ? (simulatedMode ? "secondary" : "default") : "destructive"}>
                  {connected ? (simulatedMode ? "Simulado" : "Conectada") : "Desconectada"}
                </Badge>
              </div>
            </div>
            <CardDescription>Configuração da balança para venda por peso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modelo / Protocolo</Label>
              <Select value={scaleConfig?.protocol || "toledo"} onValueChange={handleProtocolChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCALE_MODELS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedScaleModel && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {selectedScaleModel.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Baud Rate</Label>
              <Select value={String(scaleConfig?.baud_rate || 9600)} onValueChange={(v) => updateScaleConfig({ baud_rate: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2400, 4800, 9600, 19200, 38400, 57600, 115200].map(r => (
                    <SelectItem key={r} value={String(r)}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Web Serial API info */}
            <div className={`rounded-md p-3 text-xs space-y-1 ${webSerialSupported ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"}`}>
              {webSerialSupported ? (
                <>
                  <p className="font-medium">✓ Web Serial API disponível</p>
                  <p>Ao clicar em "Conectar Balança", o navegador abrirá um seletor de porta serial. Selecione a porta da balança (ex: USB Serial Device).</p>
                  <p>Requer HTTPS e Chrome/Edge 89+.</p>
                </>
              ) : (
                <>
                  <p className="font-medium">⚠ Web Serial API não disponível</p>
                  <p>Use Chrome ou Edge com HTTPS para conexão direta com a balança. O modo simulado estará disponível para testes.</p>
                </>
              )}
            </div>

            {scaleError && (
              <div className="rounded-md p-3 text-xs bg-destructive/10 text-destructive">
                {scaleError}
              </div>
            )}

            <Button 
              variant={connected ? "destructive" : "outline"} 
              className="w-full" 
              onClick={testScale}
            >
              <Scale className="h-4 w-4 mr-1" />
              {connected ? "Desconectar Balança" : "Conectar Balança"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
