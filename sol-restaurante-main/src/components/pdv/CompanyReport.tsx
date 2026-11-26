import { useState, useEffect } from "react";
import { Loader2, Building2, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { CompanyConsumption } from "@/types/company";

interface CompanyReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyReport({ open, onOpenChange }: CompanyReportProps) {
  const [data, setData] = useState<CompanyConsumption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from("company_consumption")
      .select("*")
      .order("company_name");

    if (!error && result) {
      setData(result as CompanyConsumption[]);
    }
    setLoading(false);
  };

  const formatPrice = (price: number) =>
    `R$ ${price.toFixed(2).replace(".", ",")}`;

  const formatMonth = (monthStr: string | null) => {
    if (!monthStr) return "Sem pedidos";
    const date = new Date(monthStr);
    return date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  // Group by company
  const grouped = data.reduce<
    Record<string, { name: string; cnpj: string | null; limit: number; months: CompanyConsumption[] }>
  >((acc, item) => {
    if (!acc[item.company_id]) {
      acc[item.company_id] = {
        name: item.company_name,
        cnpj: item.cnpj,
        limit: item.monthly_limit,
        months: [],
      };
    }
    acc[item.company_id].months.push(item);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Relatório de Consumo por Empresa
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Carregando relatório...
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum dado de consumo encontrado</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([companyId, company]) => {
              const currentMonth = company.months.find((m) => {
                if (!m.month) return false;
                const d = new Date(m.month);
                const now = new Date();
                return (
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear()
                );
              });
              const currentConsumed = currentMonth?.total_consumed || 0;
              const overLimit =
                company.limit > 0 && currentConsumed > company.limit;
              const nearLimit =
                company.limit > 0 && currentConsumed > company.limit * 0.8;

              return (
                <div key={companyId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {company.name}
                      </h3>
                      {company.cnpj && (
                        <p className="text-xs text-muted-foreground">
                          CNPJ: {company.cnpj}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Limite: {formatPrice(company.limit)}
                      </p>
                      {overLimit && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Acima do limite
                        </Badge>
                      )}
                      {!overLimit && nearLimit && (
                        <Badge variant="secondary" className="text-xs">
                          Próximo do limite
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-center">Pedidos</TableHead>
                        <TableHead className="text-right">
                          Total Consumido
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {company.months
                        .filter((m) => m.order_count > 0)
                        .map((month, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{formatMonth(month.month)}</TableCell>
                            <TableCell className="text-center">
                              {month.order_count}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatPrice(month.total_consumed)}
                            </TableCell>
                          </TableRow>
                        ))}
                      {company.months.every((m) => m.order_count === 0) && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center text-muted-foreground"
                          >
                            Nenhum pedido registrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
