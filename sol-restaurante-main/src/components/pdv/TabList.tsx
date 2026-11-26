import { useState } from "react";
import { TabQrBatchPrint } from "./TabQrCode";
import { TabScanner } from "./TabScanner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  RefreshCw,
  UtensilsCrossed,
  XCircle,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Tab, TabStatus } from "@/types/tab";
import { TAB_STATUS_LABELS, TAB_STATUS_COLORS } from "@/types/tab";

interface TabListProps {
  tabs: Tab[];
  loading: boolean;
  role: string;
  onRefresh: () => void;
  onOpenTab: (tabNumber: number, customerName?: string) => Promise<Tab | null>;
  onSelectTab: (tab: Tab) => void;
  onCancelTab: (tabId: string) => Promise<boolean>;
}

export function TabList({
  tabs,
  loading,
  role,
  onRefresh,
  onOpenTab,
  onSelectTab,
  onCancelTab,
}: TabListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<TabStatus | "all">("all");
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState("");
  const [customerName, setCustomerName] = useState("");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const filteredTabs = tabs.filter((tab) => {
    const matchesSearch =
      tab.code.includes(searchTerm) ||
      String(tab.tab_number).includes(searchTerm) ||
      tab.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || tab.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenTab = async () => {
    const num = parseInt(selectedNumber);
    if (num >= 1 && num <= 100) {
      const tab = await onOpenTab(num, customerName || undefined);
      if (tab) {
        setOpenDialogOpen(false);
        setSelectedNumber("");
        setCustomerName("");
        onSelectTab(tab);
      }
    }
  };

  const handleQuickOpen = async (tab: Tab) => {
    if (tab.status === "free") {
      setSelectedNumber(String(tab.tab_number));
      setOpenDialogOpen(true);
    } else if (tab.status === "open" || tab.status === "consuming" || tab.status === "awaiting_payment") {
      onSelectTab(tab);
    }
  };

  const handleScanResult = (tabNumber: number) => {
    const tab = tabs.find((t) => t.tab_number === tabNumber);
    if (tab) {
      handleQuickOpen(tab);
    } else {
      // Tab not in list yet — open it
      setSelectedNumber(String(tabNumber));
      setOpenDialogOpen(true);
    }
  };

  const freeTabs = tabs.filter((t) => t.status === "free").length;
  const activeTabs = tabs.filter((t) => t.status === "open" || t.status === "consuming").length;
  const awaitingPayment = tabs.filter((t) => t.status === "awaiting_payment").length;

  const getStatusBorderColor = (status: TabStatus) => {
    switch (status) {
      case "free": return "border-muted";
      case "open": return "border-blue-400";
      case "consuming": return "border-green-400";
      case "awaiting_payment": return "border-yellow-400";
      case "finalized": return "border-gray-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 items-center">
          <h2 className="text-xl font-bold">Comandas Fixas (001-100)</h2>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nº comanda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TabStatus | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="free">Livres</SelectItem>
              <SelectItem value="open">Abertas</SelectItem>
              <SelectItem value="consuming">Em Consumo</SelectItem>
              <SelectItem value="awaiting_payment">Aguard. Pgto</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setScannerOpen(true)} title="Ler QR Code do cartão">
            <QrCode className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Livres</p>
            <p className="text-2xl font-bold text-muted-foreground">{freeTabs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Em Uso</p>
            <p className="text-2xl font-bold text-green-600">{activeTabs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Aguard. Pgto</p>
            <p className="text-2xl font-bold text-yellow-600">{awaitingPayment}</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid of comandas */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando comandas...</div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {filteredTabs.map((tab) => (
            <Card
              key={tab.id}
              className={`cursor-pointer hover:shadow-md transition-all border-2 ${getStatusBorderColor(tab.status)} ${tab.status === "free" ? "opacity-60 hover:opacity-100" : ""}`}
              onClick={() => handleQuickOpen(tab)}
            >
              <CardContent className="p-2 text-center">
                <p className="font-mono font-bold text-lg">{tab.code}</p>
                {tab.status !== "free" && (
                  <>
                    <Badge className={`${TAB_STATUS_COLORS[tab.status]} text-[10px] px-1`}>
                      {tab.status === "consuming" ? "Consumo" : tab.status === "awaiting_payment" ? "Pgto" : TAB_STATUS_LABELS[tab.status]}
                    </Badge>
                    {tab.subtotal > 0 && (
                      <p className="text-xs font-semibold text-primary mt-1">{formatCurrency(tab.subtotal)}</p>
                    )}
                  </>
                )}
                {tab.status === "free" && (
                  <p className="text-[10px] text-muted-foreground">Livre</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Open Comanda Dialog */}
      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Abrir Comanda {selectedNumber.padStart(3, "0")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Cliente (opcional)</Label>
              <Input
                placeholder="Ex: João"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleOpenTab()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleOpenTab}>Abrir Comanda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Scanner */}
      <TabScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onTabNumber={handleScanResult}
      />

      {/* QR Codes batch print */}
      <div className="mt-6">
        <TabQrBatchPrint baseUrl={window.location.origin} />
      </div>
    </div>
  );
}
