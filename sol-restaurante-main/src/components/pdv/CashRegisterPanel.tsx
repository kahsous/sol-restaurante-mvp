import { DollarSign, TrendingUp, TrendingDown, CreditCard, Smartphone, Banknote, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CashRegisterClose } from "./CashRegisterClose";
import { CashMovementDialog } from "./CashMovementDialog";
import type { CashRegister, CashMovement, PaymentMethodType, MovementType } from "@/types/cashRegister";
import { PAYMENT_METHOD_CONFIG, MOVEMENT_TYPE_LABELS } from "@/types/cashRegister";

interface CashRegisterPanelProps {
  register: CashRegister;
  movements: CashMovement[];
  totals: {
    totalSales: number;
    withdrawals: number;
    deposits: number;
    byMethod: Record<PaymentMethodType, number>;
  };
  cashInDrawer: number;
  drawerOpen: boolean;
  role: string;
  operatorEmail: string;
  onClose: (closingBalance: number, notes?: string) => Promise<{ error: Error | null; difference?: number }>;
  onRegisterMovement: (type: MovementType, amount: number, description?: string) => Promise<{ error: Error | null }>;
}

export function CashRegisterPanel({
  register,
  movements,
  totals,
  cashInDrawer,
  drawerOpen,
  role,
  operatorEmail,
  onClose,
  onRegisterMovement,
}: CashRegisterPanelProps) {
  const formatPrice = (price: number) =>
    `R$ ${price.toFixed(2).replace(".", ",")}`;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMethodIcon = (method: PaymentMethodType) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "credit_card":
      case "debit_card":
        return <CreditCard className="h-4 w-4" />;
      case "pix":
        return <Smartphone className="h-4 w-4" />;
    }
  };

  const isAdmin = role === "admin";

  return (
    <div className="space-y-4">
      {/* Drawer Status Alert */}
      {drawerOpen && (
        <div className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            <span className="font-bold">GAVETA ABERTA</span>
          </div>
        </div>
      )}

      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="gap-1 text-sm">
            <Clock className="h-3.5 w-3.5" />
            Aberto às {formatTime(register.opened_at)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Sangria and Suprimento - available to operators and admins */}
          <CashMovementDialog type="withdrawal" onSubmit={onRegisterMovement} />
          <CashMovementDialog type="deposit" onSubmit={onRegisterMovement} />
          {/* Close - admin only */}
          {isAdmin && (
            <CashRegisterClose
              openingBalance={register.opening_balance}
              expectedCash={cashInDrawer}
              registerId={register.id}
              operatorEmail={operatorEmail}
              totals={totals}
              onClose={onClose}
            />
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Saldo Inicial</div>
            <div className="text-xl font-bold">{formatPrice(register.opening_balance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Total Vendas
            </div>
            <div className="text-xl font-bold text-green-600">{formatPrice(totals.totalSales)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> Sangrias
            </div>
            <div className="text-xl font-bold text-destructive">
              {totals.withdrawals > 0 ? `- ${formatPrice(totals.withdrawals)}` : formatPrice(0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Dinheiro em Caixa</div>
            <div className="text-xl font-bold text-primary">{formatPrice(cashInDrawer)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Payment Method */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vendas por Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(PAYMENT_METHOD_CONFIG) as [PaymentMethodType, typeof PAYMENT_METHOD_CONFIG[PaymentMethodType]][]).map(
              ([method, config]) => (
                <div
                  key={method}
                  className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                >
                  {getMethodIcon(method)}
                  <div>
                    <div className="text-xs text-muted-foreground">{config.label}</div>
                    <div className="font-semibold">
                      {formatPrice(totals.byMethod[method] || 0)}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Movements */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Movimentações do Turno</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma movimentação registrada
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded"
                >
                  <div className="flex items-center gap-2">
                    {getMethodIcon(movement.payment_method)}
                    <div>
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        {MOVEMENT_TYPE_LABELS[movement.type]}
                        {movement.type === "withdrawal" && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">Sangria</Badge>
                        )}
                        {movement.type === "deposit" && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Suprimento</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(movement.created_at)}
                        {movement.description && ` • ${movement.description}`}
                        {movement.drawer_opened && " • 🔓 Gaveta"}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${
                      movement.type === "withdrawal" || movement.type === "change"
                        ? "text-destructive"
                        : "text-green-600"
                    }`}
                  >
                    {movement.type === "withdrawal" || movement.type === "change" ? "-" : "+"}
                    {formatPrice(movement.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
