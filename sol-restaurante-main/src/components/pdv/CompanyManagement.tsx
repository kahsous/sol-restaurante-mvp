import { useState } from "react";
import {
  Building2,
  Plus,
  Loader2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCompanies } from "@/hooks/useCompanies";
import { CompanyReport } from "./CompanyReport";
import type { Company } from "@/types/company";

interface CompanyFormData {
  name: string;
  cnpj: string;
  contact_person: string;
  phone: string;
  monthly_limit: string;
}

const emptyForm: CompanyFormData = {
  name: "",
  cnpj: "",
  contact_person: "",
  phone: "",
  monthly_limit: "0",
};

interface CompanyManagementProps {
  isAdmin: boolean;
}

export function CompanyManagement({ isAdmin }: CompanyManagementProps) {
  const { companies, loading, createCompany, updateCompany, toggleActive } =
    useCompanies();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7)
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const openCreateDialog = () => {
    setEditingCompany(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    setForm({
      name: company.name,
      cnpj: company.cnpj || "",
      contact_person: company.contact_person || "",
      phone: company.phone || "",
      monthly_limit: company.monthly_limit.toString(),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({
        title: "Nome obrigatório",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      cnpj: form.cnpj.replace(/\D/g, "") || null,
      contact_person: form.contact_person.trim() || null,
      phone: form.phone.replace(/\D/g, "") || null,
      monthly_limit: parseFloat(form.monthly_limit) || 0,
      is_active: true,
    };

    if (editingCompany) {
      await updateCompany(editingCompany.id, payload);
    } else {
      await createCompany(payload);
    }

    setDialogOpen(false);
    setSubmitting(false);
  };

  const formatPrice = (price: number) =>
    `R$ ${price.toFixed(2).replace(".", ",")}`;

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        Carregando empresas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Empresas Clientes
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie empresas e seus limites de crédito
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setReportOpen(true)}>
              <BarChart3 className="h-4 w-4 mr-1" />
              Relatório
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? "Editar Empresa" : "Cadastrar Empresa"}
                </DialogTitle>
                <DialogDescription>
                  {editingCompany
                    ? "Atualize os dados da empresa"
                    : "Preencha os dados da empresa cliente"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome *</Label>
                    <Input
                      id="company-name"
                      placeholder="Nome da empresa"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-cnpj">CNPJ</Label>
                    <Input
                      id="company-cnpj"
                      placeholder="00.000.000/0000-00"
                      value={formatCnpj(form.cnpj)}
                      onChange={(e) =>
                        setForm({ ...form, cnpj: e.target.value })
                      }
                      maxLength={18}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-contact">Responsável</Label>
                    <Input
                      id="company-contact"
                      placeholder="Nome do responsável"
                      value={form.contact_person}
                      onChange={(e) =>
                        setForm({ ...form, contact_person: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Telefone</Label>
                    <Input
                      id="company-phone"
                      placeholder="(13) 99999-9999"
                      value={formatPhone(form.phone)}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-limit">Limite Mensal (R$)</Label>
                    <Input
                      id="company-limit"
                      type="number"
                      placeholder="0.00"
                      value={form.monthly_limit}
                      onChange={(e) =>
                        setForm({ ...form, monthly_limit: e.target.value })
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingCompany ? (
                      "Salvar"
                    ) : (
                      "Cadastrar"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma empresa cadastrada</p>
          <p className="text-sm mt-1">
            Cadastre empresas para vincular pedidos e comandas
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card
              key={company.id}
              className={!company.is_active ? "opacity-60" : ""}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {company.name}
                  </CardTitle>
                  <Badge variant={company.is_active ? "default" : "secondary"}>
                    {company.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {company.cnpj && (
                  <p className="text-sm text-muted-foreground">
                    CNPJ: {formatCnpj(company.cnpj)}
                  </p>
                )}
                {company.contact_person && (
                  <p className="text-sm text-muted-foreground">
                    Responsável: {company.contact_person}
                  </p>
                )}
                {company.phone && (
                  <p className="text-sm text-muted-foreground">
                    Tel: {formatPhone(company.phone)}
                  </p>
                )}
                <p className="text-sm font-medium">
                  Limite: {formatPrice(company.monthly_limit)}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(company)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleActive(company.id, company.is_active)
                    }
                  >
                    {company.is_active ? (
                      <>
                        <ToggleRight className="h-3 w-3 mr-1" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-3 w-3 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && (
        <CompanyReport open={reportOpen} onOpenChange={setReportOpen} />
      )}
    </div>
  );
}
