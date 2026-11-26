import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Share, MoreVertical, Plus, ArrowLeft, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallApp = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    if (isStandalone) setIsInstalled(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const steps = isIOS
    ? [
        { icon: <Share className="w-6 h-6" />, text: "Toque no botao Compartilhar", detail: "Na barra inferior do Safari" },
        { icon: <Plus className="w-6 h-6" />, text: 'Selecione "Adicionar a Tela de Inicio"', detail: "Role para baixo se necessario" },
        { icon: <CheckCircle2 className="w-6 h-6" />, text: 'Confirme tocando em "Adicionar"', detail: "O app aparecera na sua tela inicial" },
      ]
    : [
        { icon: <MoreVertical className="w-6 h-6" />, text: "Toque no menu do navegador", detail: "Os 3 pontinhos no canto superior" },
        { icon: <Download className="w-6 h-6" />, text: 'Selecione "Instalar aplicativo"', detail: 'Ou "Adicionar a tela inicial"' },
        { icon: <CheckCircle2 className="w-6 h-6" />, text: "Confirme a instalacao", detail: "O app aparecera na sua tela inicial" },
      ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-display font-bold text-lg text-foreground">Instalar App</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        {/* Hero section */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20">
            <img src="/pwa-icon-512.png" alt="Sol Menu" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground">Sol Menu Master</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Instale nosso app para acesso rápido ao cardápio, pedidos e para
            <strong className="text-foreground"> enviar comprovantes PIX direto do banco</strong>.
          </p>
        </div>

        {/* Installed state */}
        {isInstalled ? (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-semibold text-foreground">App já instalado!</p>
              <p className="text-sm text-muted-foreground">
                Agora ao compartilhar comprovantes do banco, o Sol Menu aparecerá como opção.
              </p>
              <Button onClick={() => navigate("/")} className="w-full mt-2">
                Ir para o Cardápio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Install button (Android/Chrome) */}
            {deferredPrompt && (
              <Button onClick={handleInstall} size="lg" className="w-full text-base gap-2 py-6 shadow-lg">
                <Download className="w-5 h-5" />
                Instalar Agora
              </Button>
            )}

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { emoji: "⚡", label: "Acesso rápido" },
                { emoji: "📱", label: "Como um app" },
                { emoji: "📤", label: "Enviar PIX fácil" },
              ].map((b) => (
                <div key={b.label} className="bg-muted/50 rounded-xl p-3 space-y-1">
                  <span className="text-2xl">{b.emoji}</span>
                  <p className="text-xs font-medium text-foreground">{b.label}</p>
                </div>
              ))}
            </div>

            {/* Step-by-step */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                {isIOS ? "Como instalar no iPhone" : "Como instalar no Android"}
              </h3>

              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4 bg-muted/30 rounded-xl p-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{step.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                    </div>
                    <div className="flex-shrink-0 text-muted-foreground">{step.icon}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share target explanation */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5 space-y-2">
                <p className="font-semibold text-sm text-foreground">💡 Por que instalar?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Depois de instalado, quando você fizer um PIX e o banco mostrar a opção
                  de compartilhar comprovante, o <strong className="text-foreground">Sol Menu</strong> aparecerá
                  como destino — enviando o comprovante direto para nós, sem precisar de print ou WhatsApp!
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default InstallApp;
