import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, ShieldAlert, LogOut, Mail } from "lucide-react";
import { toast } from "sonner";

interface Tenant {
  id: string;
  slug: string;
  name: string;
  business_type: string;
  is_active: boolean;
  plan: string;
  owner_user_id: string | null;
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteDialog, setInviteDialog] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);

  const [newTenant, setNewTenant] = useState({ slug: "", name: "", business_type: "restaurante", ownerEmail: "" });

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/admin/pdv");
      return;
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const isSuper = (roles ?? []).some((r: any) => r.role === "super_admin");
    setAuthorized(isSuper);
    if (isSuper) await loadTenants();
    setLoading(false);
  };

  const loadTenants = async () => {
    const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
    setTenants((data ?? []) as Tenant[]);
  };

  useEffect(() => {
    checkAccess();
  }, []);

  const handleCreate = async () => {
    if (!newTenant.slug || !newTenant.name) {
      toast.error("Slug e nome são obrigatórios");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("tenants").insert({
      slug: newTenant.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name: newTenant.name,
      business_type: newTenant.business_type,
    }).select().single();

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    if (newTenant.ownerEmail && data) {
      const { error: fnErr } = await supabase.functions.invoke("create-tenant-owner", {
        body: { email: newTenant.ownerEmail, tenant_id: data.id },
      });
      if (fnErr) {
        toast.error("Restaurante criado, mas falha ao convidar dono: " + fnErr.message);
      } else {
        toast.success("Restaurante criado e convite enviado!");
      }
    } else {
      toast.success("Restaurante criado!");
    }

    setDialogOpen(false);
    setNewTenant({ slug: "", name: "", business_type: "restaurante", ownerEmail: "" });
    await loadTenants();
    setSaving(false);
  };

  const toggleActive = async (tenant: Tenant) => {
    await supabase.from("tenants").update({ is_active: !tenant.is_active }).eq("id", tenant.id);
    await loadTenants();
  };

  const handleInvite = async (email: string) => {
    if (!inviteDialog) return;
    setSaving(true);
    const { error } = await supabase.functions.invoke("create-tenant-owner", {
      body: { email, tenant_id: inviteDialog.id },
    });
    if (error) toast.error(error.message);
    else toast.success("Convite enviado!");
    setInviteDialog(null);
    setSaving(false);
    await loadTenants();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/pdv");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h1 className="text-xl font-bold mb-2">Acesso restrito</h1>
            <p className="text-muted-foreground mb-4">Esta área é exclusiva para super administradores do sistema.</p>
            <Button onClick={() => navigate("/")}>Voltar ao site</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Painel do Sistema</h1>
            <p className="text-muted-foreground">Gerenciar restaurantes (tenants) da plataforma</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Novo restaurante</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar restaurante</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Nome</Label>
                    <Input value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} placeholder="Sorveteria da Ana" />
                  </div>
                  <div>
                    <Label>Slug (identificador na URL)</Label>
                    <Input value={newTenant.slug} onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })} placeholder="sorveteria-da-ana" />
                  </div>
                  <div>
                    <Label>Tipo de negócio</Label>
                    <select className="w-full border rounded-md h-10 px-3" value={newTenant.business_type} onChange={(e) => setNewTenant({ ...newTenant, business_type: e.target.value })}>
                      <option value="restaurante">Restaurante</option>
                      <option value="sorveteria">Sorveteria</option>
                      <option value="lanchonete">Lanchonete</option>
                      <option value="padaria">Padaria</option>
                      <option value="pizzaria">Pizzaria</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <Label>Email do dono (opcional — envia convite)</Label>
                    <Input type="email" value={newTenant.ownerEmail} onChange={(e) => setNewTenant({ ...newTenant, ownerEmail: e.target.value })} placeholder="dono@exemplo.com" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />Sair</Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Restaurantes ({tenants.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Dono</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell><code className="text-xs">{t.slug}</code></TableCell>
                    <TableCell><Badge variant="outline">{t.business_type}</Badge></TableCell>
                    <TableCell>{t.plan}</TableCell>
                    <TableCell>{t.owner_user_id ? "✓" : <Badge variant="destructive">sem dono</Badge>}</TableCell>
                    <TableCell><Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setInviteDialog(t)}>
                        <Mail className="w-4 h-4 mr-1" />Convidar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {tenants.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum restaurante cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-6 text-center">
          Você é super administrador — pode criar e desativar restaurantes, mas não acessa os dados operacionais dos clientes.
        </p>
      </div>

      <Dialog open={!!inviteDialog} onOpenChange={(o) => !o && setInviteDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convidar dono de {inviteDialog?.name}</DialogTitle></DialogHeader>
          <InviteForm onSubmit={handleInvite} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InviteForm({ onSubmit, saving }: { onSubmit: (email: string) => void; saving: boolean }) {
  const [email, setEmail] = useState("");
  return (
    <div className="space-y-3">
      <div>
        <Label>Email do dono</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dono@exemplo.com" />
      </div>
      <Button onClick={() => onSubmit(email)} disabled={saving || !email} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar convite"}
      </Button>
    </div>
  );
}
