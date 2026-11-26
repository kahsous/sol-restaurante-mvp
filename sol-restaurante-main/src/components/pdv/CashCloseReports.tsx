import { useState, useEffect, forwardRef } from "react";
import { CalendarIcon, FileText, Download, TrendingUp, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import type { CashRegister, CashMovement, PaymentMethodType } from "@/types/cashRegister";
import { PAYMENT_METHOD_CONFIG } from "@/types/cashRegister";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportData {
  register: CashRegister;
  movements: CashMovement[];
  totals: {
    totalSales: number;
    withdrawals: number;
    deposits: number;
    byMethod: Record<PaymentMethodType, number>;
  };
  difference: number | null;
}

interface Summary {
  totalRegisters: number;
  totalSales: number;
  totalDifferences: number;
  averageSales: number;
  problemRegisters: number;
}

export const CashCloseReports = forwardRef<HTMLDivElement, {}>(function CashCloseReports(_props, ref) {
  const [data, setData] = useState<ReportData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const formatPrice = (price: number) =>
    `R$ ${price.toFixed(2).replace(".", ",")}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "HH:mm", { locale: ptBR });
  };

  const calculateTotals = (movements: CashMovement[]) => {
    return movements.reduce(
      (acc, m) => {
        const amount = Number(m.amount);
        if (m.type === "sale") {
          acc.totalSales += amount;
          acc.byMethod[m.payment_method as PaymentMethodType] =
            (acc.byMethod[m.payment_method as PaymentMethodType] || 0) + amount;
        } else if (m.type === "withdrawal") {
          acc.withdrawals += amount;
        } else if (m.type === "deposit") {
          acc.deposits += amount;
        }
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

  const fetchReports = async () => {
    setLoading(true);

    const { data: registers, error: regError } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("status", "closed")
      .gte("closed_at", startOfDay(startDate).toISOString())
      .lte("closed_at", endOfDay(endDate).toISOString())
      .order("closed_at", { ascending: false });

    if (regError) {
      console.error("Error fetching registers:", regError);
      setLoading(false);
      return;
    }

    const reportData: ReportData[] = [];
    let totalSalesSum = 0;
    let totalDifferencesSum = 0;
    let problemCount = 0;

    for (const reg of (registers || []) as CashRegister[]) {
      const { data: movements } = await supabase
        .from("cash_movements")
        .select("*")
        .eq("cash_register_id", reg.id)
        .order("created_at", { ascending: true });

      const totals = calculateTotals((movements || []) as CashMovement[]);
      const difference = reg.closing_balance !== null && reg.expected_balance !== null
        ? reg.closing_balance - reg.expected_balance
        : null;

      if (difference !== null && difference !== 0) {
        problemCount++;
        totalDifferencesSum += Math.abs(difference);
      }

      totalSalesSum += totals.totalSales;

      reportData.push({
        register: reg,
        movements: (movements || []) as CashMovement[],
        totals,
        difference,
      });
    }

    setData(reportData);
    setSummary({
      totalRegisters: reportData.length,
      totalSales: totalSalesSum,
      totalDifferences: totalDifferencesSum,
      averageSales: reportData.length > 0 ? totalSalesSum / reportData.length : 0,
      problemRegisters: problemCount,
    });
    
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const exportToCSV = () => {
    const csvContent = [
      ["Data", "Operador", "Abertura", "Fechamento", "Vendas", "Esperado", "Contado", "Diferença", "Observações"],
      ...data.map(({ register, totals, difference }) => [
        formatDate(register.closed_at || ""),
        register.user_id,
        formatPrice(register.opening_balance),
        register.closed_at ? formatTime(register.closed_at) : "-",
        formatPrice(totals.totalSales),
        formatPrice(register.expected_balance || 0),
        formatPrice(register.closing_balance || 0),
        difference !== null ? formatPrice(difference) : "-",
        register.notes || "",
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-fechamentos-${format(startDate, "yyyy-MM-dd")}-a-${format(endDate, "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando relatórios...
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Relatórios de Fechamento de Caixa
          </h2>
          <p className="text-muted-foreground">
            Análise detalhada dos fechamentos de caixa por período
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(startDate, "dd/MM/yy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          <span className="text-muted-foreground">até</span>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(endDate, "dd/MM/yy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Caixas
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold">{summary.totalRegisters}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Vendas Totais
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(summary.totalSales)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Média por Caixa
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold">
                {formatPrice(summary.averageSales)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Com Diferenças
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-amber-600">
                {summary.problemRegisters}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Diferenças
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-destructive">
                {formatPrice(summary.totalDifferences)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fechamentos Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3" />
              <p>Nenhum fechamento encontrado no período selecionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Dinheiro</TableHead>
                    <TableHead>Cartões</TableHead>
                    <TableHead>PIX</TableHead>
                    <TableHead>Esperado</TableHead>
                    <TableHead>Contado</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map(({ register, totals, difference }) => (
                    <TableRow key={register.id}>
                      <TableCell className="font-medium">
                        {formatDate(register.closed_at || "")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTime(register.opened_at)} — {register.closed_at ? formatTime(register.closed_at) : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatPrice(totals.totalSales)}
                      </TableCell>
                      <TableCell>
                        {formatPrice(totals.byMethod.cash || 0)}
                      </TableCell>
                      <TableCell>
                        {formatPrice((totals.byMethod.credit_card || 0) + (totals.byMethod.debit_card || 0))}
                      </TableCell>
                      <TableCell>
                        {formatPrice(totals.byMethod.pix || 0)}
                      </TableCell>
                      <TableCell>
                        {formatPrice(register.expected_balance || 0)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(register.closing_balance || 0)}
                      </TableCell>
                      <TableCell>
                        {difference !== null ? (
                          difference === 0 ? (
                            <Badge className="gap-1 bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3" />
                              Conferido
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {difference > 0 ? "Sobra" : "Quebra"} {formatPrice(Math.abs(difference))}
                            </Badge>
                          )
                        ) : (
                          <Badge variant="secondary">—</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});