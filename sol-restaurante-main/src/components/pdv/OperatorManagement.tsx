import { useState, useEffect } from "react";
import { Loader2, UserPlus, Trash2, Users, Shield, User, ChefHat, Package } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número");

type AppRole = "admin" | "operator" | "cozinha" | "estoque";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  operator: "Operador de Caixa",
  cozinha: "Cozinha",
  estoque: "Estoque",
};

const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  admin: <Shield className="h-4 w-4 text-primary" />,
  operator: <User className="h-4 w-4" />,
  cozinha: <ChefHat className="h-4 w-4 text-orange-500" />,
  estoque: <Package className="h-4 w-4 text-blue-500" />,
};

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
}

interface OperatorManagementProps {
  currentUserId: string;
  onCreateUser: (email: string, password: string, role: AppRole) => Promise<{ error: Error | null; userId?: string }>;
  onRemoveRole: (userId: string) => Promise<{ error: Error | null }>;
}

export function OperatorManagement({
  currentUserId,
  onCreateUser,
  onRemoveRole,
}: OperatorManagementProps) {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("operator");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar usuários", variant: "destructive" });
    } else {
      setUsers(data as UserRole[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel("user-roles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => fetchUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(newEmail);
    } catch {
      toast({ title: "Email inválido", description: "Informe um email válido", variant: "destructive" });
      return;
    }

    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      const zodError = err as z.ZodError;
      toast({
        title: "Senha inválida",
        description: zodError.errors?.[0]?.message || "Requisitos: mín. 8 caracteres, 1 maiúscula, 1 número",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    const { error } = await onCreateUser(newEmail, newPassword, newRole);

    if (error) {
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Usuário criado!",
        description: `${newEmail} foi cadastrado como ${ROLE_LABELS[newRole]}`,
      });
      setNewEmail("");
      setNewPassword("");
      setNewRole("operator");
      setDialogOpen(false);
      fetchUsers();
    }

    setCreating(false);
  };

  const handleRemoveUser = async (userId: string) => {
    const { error } = await onRemoveRole(userId);

    if (error) {
      toast({ title: "Erro ao remover usuário", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuário removido", description: "O acesso ao PDV foi revogado" });
      fetchUsers();
    }
  };

  const groupedUsers: Record<AppRole, UserRole[]> = {
    admin: users.filter((u) => u.role === "admin"),
    operator: users.filter((u) => u.role === "operator"),
    cozinha: users.filter((u) => u.role === "cozinha"),
    estoque: users.filter((u) => u.role === "estoque"),
  };

  const renderUserCard = (role: AppRole, roleUsers: UserRole[]) => (
    <Card key={role}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {ROLE_ICONS[role]}
          {ROLE_LABELS[role]} ({roleUsers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {roleUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum {ROLE_LABELS[role].toLowerCase()} cadastrado</p>
        ) : (
          <div className="space-y-2">
            {roleUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {ROLE_ICONS[role]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {user.user_id === currentUserId ? "Você" : ROLE_LABELS[role]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {user.user_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={role === "admin" ? "default" : "secondary"}>
                    {ROLE_LABELS[role]}
                  </Badge>
                  {role !== "admin" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Este usuário perderá o acesso ao PDV. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveUser(user.user_id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestão de Usuários
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie usuários e permissões do PDV
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-1" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Usuário</DialogTitle>
              <DialogDescription>
                Crie uma conta com perfil de acesso ao PDV
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="user-role">Perfil</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operador de Caixa</SelectItem>
                      <SelectItem value="cozinha">Cozinha</SelectItem>
                      <SelectItem value="estoque">Estoque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Senha</Label>
                  <Input
                    id="user-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres, 1 maiúscula e 1 número
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Usuário"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Carregando usuários...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.entries(groupedUsers) as [AppRole, UserRole[]][]).map(
            ([role, roleUsers]) => renderUserCard(role, roleUsers)
          )}
        </div>
      )}
    </div>
  );
}
