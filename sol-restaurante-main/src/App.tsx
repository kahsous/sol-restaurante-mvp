import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useThemeApplier } from "@/hooks/useThemeApplier";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Pdv from "./pages/Pdv";
import ComandaView from "./pages/ComandaView";
import KitchenDisplay from "./pages/KitchenDisplay";
import NotFound from "./pages/NotFound";
import InstallApp from "./pages/InstallApp";
import Admin from "./pages/Admin";
import Cardapio99Food from "./pages/Cardapio99Food";
import { OnlineOrder } from "./pages/OnlineOrder";
import { PDVCashier } from "./pages/PDVCashier";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function AppContent() {
  useDocumentMeta();
  useThemeApplier();

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Menu />} />
        <Route path="/delivery" element={<Navigate to="/" replace />} />
        <Route path="/pedido-online" element={<OnlineOrder />} />
        <Route path="/install" element={<InstallApp />} />

        {/* Compatibilidade com rotas antigas */}
        <Route path="/cardapio" element={<Navigate to="/" replace />} />
        <Route path="/pdv" element={<Navigate to="/admin/pdv" replace />} />
        <Route path="/cozinha" element={<Navigate to="/admin/cozinha" replace />} />
        <Route path="/comanda/:number" element={<ComandaView />} />

        {/* Rotas administrativas / PDV */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/pdv" element={<Pdv />} />
        <Route path="/admin/pdv-caixa" element={<PDVCashier />} />
        <Route path="/admin/redefinir-senha" element={<ResetPassword />} />
        <Route path="/admin/comanda/:number" element={<ComandaView />} />
        <Route path="/admin/cozinha" element={<KitchenDisplay />} />
        <Route path="/cardapio-99food" element={<Cardapio99Food />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
