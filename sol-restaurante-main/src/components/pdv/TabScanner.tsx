import { useState, useRef, useEffect, useCallback } from "react";
import { QrCode, Barcode, Search, Camera, CameraOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Html5Qrcode } from "html5-qrcode";

interface TabScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTabNumber: (tabNumber: number) => void;
}

function extractTabNumber(input: string): number | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/comanda\/(\d+)/i);
  if (urlMatch) return parseInt(urlMatch[1]);
  const cmdMatch = trimmed.match(/^CMD(\d+)/i);
  if (cmdMatch) return parseInt(cmdMatch[1]);
  const numMatch = trimmed.match(/^(\d{1,3})$/);
  if (numMatch) {
    const n = parseInt(numMatch[1]);
    if (n >= 1 && n <= 100) return n;
  }
  return null;
}

export function TabScanner({ open, onOpenChange, onTabNumber }: TabScannerProps) {
  const [manualCode, setManualCode] = useState("");
  const [scanBuffer, setScanBuffer] = useState("");
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processedRef = useRef(false);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore
      }
      try {
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  }, []);

  const processInput = useCallback((input: string) => {
    const num = extractTabNumber(input);
    if (num) {
      setError("");
      stopCamera();
      onTabNumber(num);
      onOpenChange(false);
    } else {
      setError(`Código não reconhecido: "${input}"`);
    }
  }, [onTabNumber, onOpenChange, stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError("");
    setCameraLoading(true);
    processedRef.current = false;

    // First show the container, then start scanner after a tick
    setCameraActive(true);

    // Wait for DOM to render the visible element
    await new Promise((r) => setTimeout(r, 300));

    try {
      const scannerId = "tab-qr-scanner";
      const el = document.getElementById(scannerId);
      if (!el) {
        setCameraError("Elemento do scanner não encontrado.");
        setCameraLoading(false);
        setCameraActive(false);
        return;
      }

      // Clean up any previous instance
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
        try { scannerRef.current.clear(); } catch {}
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (processedRef.current) return;
          processedRef.current = true;
          // Vibrate on success if available
          if (navigator.vibrate) navigator.vibrate(200);
          processInput(decodedText);
        },
        () => {}
      );

      setCameraLoading(false);
    } catch (err: any) {
      console.error("Camera error:", err);
      const msg = String(err?.message || err || "");
      if (msg.includes("NotAllowed") || msg.includes("Permission") || msg.includes("denied")) {
        setCameraError("Permissão da câmera negada. Verifique as configurações do navegador.");
      } else if (msg.includes("NotFound") || msg.includes("Requested device not found")) {
        setCameraError("Nenhuma câmera encontrada neste dispositivo.");
      } else if (msg.includes("NotReadable") || msg.includes("Could not start")) {
        setCameraError("Câmera em uso por outro aplicativo. Feche e tente novamente.");
      } else {
        setCameraError(`Erro ao acessar câmera: ${msg}`);
      }
      setCameraActive(false);
      setCameraLoading(false);
    }
  }, [processInput, stopCamera]);

  // Cleanup on close
  useEffect(() => {
    if (open) {
      setError("");
      setManualCode("");
      setCameraError("");
      processedRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      stopCamera();
    }
  }, [open, stopCamera]);

  // Listen for barcode/QR scanner input (rapid keystrokes)
  useEffect(() => {
    if (!open) return;
    const handleKeyPress = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;
      if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
      if (e.key === "Enter" && scanBuffer.length > 0) {
        processInput(scanBuffer);
        setScanBuffer("");
        return;
      }
      if (e.key.length === 1) {
        setScanBuffer((prev) => prev + e.key);
      }
      bufferTimeoutRef.current = setTimeout(() => setScanBuffer(""), 150);
    };
    window.addEventListener("keypress", handleKeyPress);
    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
    };
  }, [open, scanBuffer, processInput]);

  const handleManualSearch = () => {
    if (manualCode.trim()) processInput(manualCode.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Ler Cartão / QR Code da Comanda
          </DialogTitle>
          <DialogDescription>
            Use a câmera, leitor de código de barras ou digite o número manualmente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Camera area - always rendered, visibility controlled */}
          {cameraActive ? (
            <div className="space-y-2">
              <div className="relative">
                <div
                  id="tab-qr-scanner"
                  className="w-full rounded-lg overflow-hidden bg-black"
                  style={{ minHeight: 280 }}
                />
                {cameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Iniciando câmera...</p>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={stopCamera}
                className="w-full gap-2"
              >
                <CameraOff className="h-4 w-4" />
                Fechar Câmera
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4 text-muted-foreground mb-3">
                <Barcode className="h-10 w-10" />
                <span className="text-xl">/</span>
                <QrCode className="h-10 w-10" />
              </div>
              <p className="text-sm text-muted-foreground text-center mb-3">
                Aproxime o cartão do leitor
                <br />
                ou use a câmera do dispositivo
              </p>
              <Button
                variant="outline"
                onClick={startCamera}
                className="gap-2"
                disabled={cameraLoading}
              >
                <Camera className="h-4 w-4" />
                Abrir Câmera
              </Button>
              {scanBuffer && (
                <p className="mt-2 text-xs text-primary animate-pulse">
                  Lendo: {scanBuffer}...
                </p>
              )}
              {cameraError && (
                <p className="mt-2 text-xs text-destructive text-center">{cameraError}</p>
              )}
            </div>
          )}

          {/* Manual input */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Ou digite o número da comanda:
            </p>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Ex: 25 ou 001"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                className="font-mono"
              />
              <Button onClick={handleManualSearch} disabled={!manualCode.trim()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
