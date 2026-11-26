import { useState } from "react";
import { Search, Users, Phone, MapPin, ShoppingCart, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Customer } from "@/hooks/useCustomers";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface CustomerCRMProps {
  customers: Customer[];
  loading: boolean;
  searchByPhone: (phone: string) => Customer[];
}

export function CustomerCRM({ customers, loading, searchByPhone }: CustomerCRMProps) {
  const [search, setSearch] = useState("");

  const filtered = search.length >= 2 ? searchByPhone(search) : customers;
  const totalCustomers = customers.length;
  const totalSpent = customers.reduce((s, c) => s + c.total_spent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" /> CRM de Clientes
        </h2>
        <Badge variant="secondary">{totalCustomers} clientes</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Clientes</p>
            <p className="text-lg font-bold">{totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Gasto</p>
            <p className="text-lg font-bold text-primary">{fmt(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
            <p className="text-lg font-bold text-amber-600">
              {fmt(totalCustomers > 0 ? totalSpent / customers.reduce((s, c) => s + c.total_orders, 0) || 0 : 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Novos (30d)</p>
            <p className="text-lg font-bold text-green-600">
              {customers.filter(c => new Date(c.created_at).getTime() > Date.now() - 30 * 86400000).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por telefone ou nome..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customer list */}
      {loading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum cliente encontrado</p>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 50).map((c) => (
            <Card key={c.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{c.name}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </div>
                    {c.address_street && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {c.address_street}, {c.address_number}
                        {c.neighborhood && ` • ${c.neighborhood}`}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <ShoppingCart className="h-3 w-3" /> {c.total_orders} pedidos
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-primary">
                      <DollarSign className="h-3 w-3" /> {fmt(c.total_spent)}
                    </div>
                    {c.last_order_at && (
                      <p className="text-xs text-muted-foreground">
                        Último: {new Date(c.last_order_at).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
