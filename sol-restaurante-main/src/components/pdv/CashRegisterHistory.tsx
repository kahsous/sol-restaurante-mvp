import { useState, useEffect, forwardRef } from "react";
import { History, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import type { CashRegister, CashMovement, PaymentMethodType } from "@/types/cashRegister";
import { PAYMENT_METHOD_CONFIG, MOVEMENT_TYPE_LABELS } from "@/types/cashRegister";

interface RegisterWithMovements extends CashRegister {
  movements: CashMovement[];
}

export const CashRegisterHistory = forwardRef<HTMLDivElement, {}>(function CashRegisterHistory(_props, ref) {
  const [registers, setRegisters] = useState<RegisterWithMovements[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatPrice = (price: number) =>
    `R$ ${price.toFixed(2).replace(".", ",")}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);

    const { data: regs, error: regError } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(30);

    if (regError) {
      console.error("Error fetching register history:", regError);
      setLoading(false);
      return;
    }

    const registersWithMovements: RegisterWithMovements[] = [];

    for (const reg of (regs || []) as CashRegister[]) {
      const { data: movs } = await supabase
        .from("cash_movements")
        .select("*")
        .eq("cash_register_id", reg.id)
        .order("created_at", { ascending: true });

      registersWithMovements.push({
        ...reg,
        movements: (movs || []) as CashMovement[],
      });
    }

    setRegisters(registersWithMovements);
    setLoading(false);
  };

  const calculateTotals = (movements: CashMovement[]) => {
    return movements.reduce(
      (acc, m) => {
        const amount = Number(m.amount);
        acc.byMethod[m.payment_method as PaymentMethodType] =
          (acc.byMethod[m.payment_method as PaymentMethodType] || 0) + (m.type === "sale" ? amount : 0);

        if (m.type === "sale") acc.totalSales += amount;
        else if (m.type === "withdrawal") acc.withdrawals += amount;
        else if (m.type === "deposit") acc.deposits += amount;

        return acc;
      },
      {
        totalSales: 0,
        withdrawals: 0,
        deposits: 0,
        byMethod: {} as Record<PaymentMethodType, number>,
      }
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando histórico...
      </div>
    );
  }

  if (registers.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-lg text-muted-foreground">Nenhum caixa fechado encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <History className="h-5 w-5" />
        Histórico de Caixas
      </h3>

      {registers.map((reg) => {
        const totals = calculateTotals(reg.movements);
        const difference =
          reg.closing_balance !== null && reg.expected_balance !== null
            ? reg.closing_balance - reg.expected_balance
            : null;
        const isExpanded = expandedId === reg.id;

        return (
          <Card key={reg.id}>
            <CardContent className="pt-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : reg.id)}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-semibold">{formatDate(reg.opened_at)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(reg.opened_at)} — {reg.closed_at ? formatTime(reg.closed_at) : "—"}
                    </div>
                  </div>
                  {difference !== null && (
                    <Badge
                      variant={difference === 0 ? "secondary" : "destructive"}
                      className="gap-1"
                    >
                      {difference === 0 ? (
                        <>
                          <CheckCircle className="h-3 w-3" /> Conferido
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          {difference > 0 ? "Sobra" : "Quebra"} {formatPrice(Math.abs(difference))}
                        </>
                      )}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Vendas</div>
                    <div className="font-semibold text-green-600">{formatPrice(totals.totalSales)}</div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-3">
                  <Separator />

                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="p-2 bg-muted rounded">
                      <div className="text-muted-foreground">Saldo Inicial</div>
                      <div className="font-semibold">{formatPrice(reg.opening_balance)}</div>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <div className="text-muted-foreground">Total Vendas</div>
                      <div className="font-semibold text-green-600">{formatPrice(totals.totalSales)}</div>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <div className="text-muted-foreground">Sangrias</div>
                      <div className="font-semibold text-destructive">
                        {totals.withdrawals > 0 ? `- ${formatPrice(totals.withdrawals)}` : formatPrice(0)}
                      </div>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <div className="text-muted-foreground">Suprimentos</div>
                      <div className="font-semibold text-green-600">
                        {totals.deposits > 0 ? `+ ${formatPrice(totals.deposits)}` : formatPrice(0)}
                      </div>
                    </div>
                  </div>

                  {/* By Payment Method */}
                  <div>
                    <div className="text-sm font-medium mb-1">Vendas por Forma de Pagamento</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {(Object.entries(PAYMENT_METHOD_CONFIG) as [PaymentMethodType, typeof PAYMENT_METHOD_CONFIG[PaymentMethodType]][]).map(
                        ([method, config]) => (
                          <div key={method} className="flex items-center gap-1.5 p-2 bg-muted/50 rounded">
                            <span>{config.icon}</span>
                            <div>
                              <div className="text-xs text-muted-foreground">{config.label}</div>
                              <div className="font-medium">{formatPrice(totals.byMethod[method] || 0)}</div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Closing details */}
                  {reg.closing_balance !== null && (
                    <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Esperado em dinheiro</span>
                        <span className="font-medium">{formatPrice(reg.expected_balance || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor contado</span>
                        <span className="font-medium">{formatPrice(reg.closing_balance)}</span>
                      </div>
                      {difference !== null && difference !== 0 && (
                        <div className="flex justify-between text-amber-600 font-semibold">
                          <span>{difference > 0 ? "Sobra" : "Quebra"}</span>
                          <span>{formatPrice(Math.abs(difference))}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {reg.notes && (
                    <div className="p-2 bg-muted/50 rounded text-sm">
                      <span className="text-muted-foreground">Obs: </span>{reg.notes}
                    </div>
                  )}

                  {/* Movements list */}
                  <div>
                    <div className="text-sm font-medium mb-1">
                      Movimentações ({reg.movements.length})
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {reg.movements.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded"
                        >
                          <div>
                            <span className="font-medium">{MOVEMENT_TYPE_LABELS[m.type]}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              • {formatTime(m.created_at)}
                              {m.description && ` • ${m.description}`}
                            </span>
                          </div>
                          <span
                            className={`font-semibold ${
                              m.type === "withdrawal" || m.type === "change"
                                ? "text-destructive"
                                : "text-green-600"
                            }`}
                          >
                            {m.type === "withdrawal" || m.type === "change" ? "-" : "+"}
                            {formatPrice(m.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
