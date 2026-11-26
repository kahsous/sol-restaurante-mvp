import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { Tab } from "@/types/tab";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";

interface TabQrCodeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: Tab;
  baseUrl: string;
}

export function TabQrCode({ open, onOpenChange, tab, baseUrl }: TabQrCodeProps) {
  const qrValue = `${baseUrl}/comanda/${tab.tab_number}`;

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=400,height=500");
    if (win) {
      win.document.write(`
        <html><head><title>QR Code Comanda ${tab.code}</title>
        <style>
          body{font-family:sans-serif;text-align:center;padding:20px}
          .code{font-size:48px;font-weight:bold;margin:10px 0}
          svg{margin:20px auto}
        </style></head>
        <body>
          <h2>Comanda</h2>
          <div class="code">${tab.code}</div>
          <div id="qr"></div>
          <p style="font-size:12px;color:#666">Escaneie para acessar</p>
          <script>
            const img = document.createElement("img");
            img.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}";
            img.width = 200; img.height = 200;
            document.getElementById("qr").appendChild(img);
            img.onload = () => window.print();
          </script>
        </body></html>
      `);
      win.document.close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code - Comanda {tab.code}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center py-4 space-y-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={qrValue} size={200} level="M" />
          </div>
          <div className="text-center">
            <p className="font-mono text-4xl font-bold">{tab.code}</p>
            <p className="text-xs text-muted-foreground mt-1">{qrValue}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handlePrint} className="w-full">
            <Printer className="h-4 w-4 mr-1" />
            Imprimir QR Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Premium batch print - black & gold card style
interface TabQrBatchPrintProps {
  baseUrl: string;
}

export function TabQrBatchPrint({ baseUrl }: TabQrBatchPrintProps) {
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("100");
  const { settings } = useRestaurantSettings();

  const restaurantName = settings?.name || "Restaurante Sol";
  const logoUrl = settings?.logo_url || "";

  const handlePrint = () => {
    const start = Math.max(1, parseInt(from) || 1);
    const end = Math.min(100, parseInt(to) || 100);

    const numbers: number[] = [];
    for (let i = start; i <= end; i++) numbers.push(i);

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;

    const cards = numbers.map((n) => {
      const code = String(n).padStart(3, "0");
      const url = `${baseUrl}/comanda/${n}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=FFFFFF&color=000000`;

      return `
        <div class="card-container">
          <!-- FRENTE -->
          <div class="card front">
            <div class="card-accent"></div>
            <div class="front-content">
              <div class="qr-box">
                <img src="${qrUrl}" width="130" height="130" alt="QR ${code}"/>
              </div>
              <div class="front-info">
                <span class="label">COMANDA</span>
                <span class="number">${code}</span>
              </div>
            </div>
          </div>
          <!-- VERSO -->
          <div class="card back">
            <div class="card-accent"></div>
            <div class="back-content">
              <div class="brand">
                ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo"/>` : ""}
                <span class="brand-name">${restaurantName}</span>
              </div>
              <div class="divider"></div>
              <p class="instructions">Por favor, entregue esta comanda ao caixa no momento do pagamento.</p>
              <div class="payment-methods">
                <div class="method"><span class="method-icon">💵</span><span>Dinheiro</span></div>
                <div class="method"><span class="method-icon">💳</span><span>Cartões</span></div>
                <div class="method"><span class="method-icon">📱</span><span>Pix</span></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    win.document.write(`
      <html><head><title>Comandas ${String(start).padStart(3,"0")} a ${String(end).padStart(3,"0")}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 10px; background: #f5f5f5; }
        h2 { text-align: center; margin: 10px 0 20px; font-size: 16px; color: #333; }
        .grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
        .card-container { display: inline-flex; gap: 6px; page-break-inside: avoid; margin-bottom: 8px; }
        .card {
          width: 260px; height: 155px;
          border-radius: 12px; overflow: hidden; position: relative;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
          color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .card-accent {
          position: absolute; top: 0; right: 0; width: 50%; height: 100%;
          background: radial-gradient(ellipse at top right, rgba(212,175,55,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .card::after {
          content: ""; position: absolute; bottom: 20px; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.4) 50%, transparent 100%);
          pointer-events: none;
        }
        /* FRONT */
        .front-content { display: flex; align-items: center; height: 100%; padding: 14px; gap: 14px; position: relative; z-index: 1; }
        .qr-box {
          background: #fff; border-radius: 8px; padding: 6px; flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .qr-box img { display: block; border-radius: 4px; }
        .front-info { display: flex; flex-direction: column; align-items: flex-start; }
        .front-info .label { font-size: 13px; font-weight: 700; letter-spacing: 3px; color: #fff; text-transform: uppercase; }
        .front-info .number { font-size: 52px; font-weight: 900; color: #d4af37; line-height: 1; margin-top: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.4); }
        /* BACK */
        .back-content { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 12px 16px; position: relative; z-index: 1; }
        .brand { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .logo { height: 28px; width: auto; object-fit: contain; }
        .brand-name { font-size: 16px; font-weight: 700; color: #d4af37; font-style: italic; }
        .divider { width: 60%; height: 1px; background: linear-gradient(90deg, transparent, #d4af37, transparent); margin: 6px 0; }
        .instructions { font-size: 9px; color: #ccc; text-align: center; line-height: 1.4; margin-bottom: 8px; }
        .payment-methods { display: flex; gap: 16px; }
        .method { display: flex; flex-direction: column; align-items: center; font-size: 8px; color: #d4af37; gap: 2px; }
        .method-icon { font-size: 16px; }
        @media print {
          body { background: #fff; padding: 5px; }
          .card { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          h2 { display: none; }
        }
      </style></head>
      <body>
        <h2>Comandas ${String(start).padStart(3,"0")} a ${String(end).padStart(3,"0")} — Frente e Verso</h2>
        <div class="grid">${cards}</div>
        <script>
          let loaded=0;const imgs=document.querySelectorAll("img");
          const total=imgs.length;
          if(total===0){setTimeout(()=>window.print(),300);}
          imgs.forEach(i=>{
            if(i.complete){loaded++;if(loaded>=total)setTimeout(()=>window.print(),300);}
            else{i.onload=()=>{loaded++;if(loaded>=total)setTimeout(()=>window.print(),300)};}
          });
        </script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <h4 className="font-semibold flex items-center gap-2 mb-3">
          <QrCode className="h-4 w-4" /> Imprimir Cartões de Comanda
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Gera cartões premium (frente + verso) com QR Code para impressão em gráfica ou impressora comum. Estilo preto e dourado.
        </p>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input type="number" min="1" max="100" value={from} onChange={(e) => setFrom(e.target.value)} className="w-20" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Até</Label>
            <Input type="number" min="1" max="100" value={to} onChange={(e) => setTo(e.target.value)} className="w-20" />
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir Cartões
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
