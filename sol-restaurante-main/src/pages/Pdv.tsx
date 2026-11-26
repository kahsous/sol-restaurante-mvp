import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePdvAuth } from "@/hooks/usePdvAuth";
import { PdvLogin } from "@/components/pdv/PdvLogin";
import { PdvDashboard } from "@/components/pdv/PdvDashboard";
import { Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Pdv() {
  const navigate = useNavigate();
  const { 
    user, 
    role, 
    loading, 
    isPdvUser, 
    hasAnyAdmin, 
    checkingAdmin,
    signIn, 
    signUp, 
    signOut,
    assignRole,
    updatePassword,
    createUserWithRole,
    removeRole,
    refreshAdminCheck,
  } = usePdvAuth();
  const { toast } = useToast();

  const handleSetupAdmin = async (email: string, password: string) => {
    // Create the admin user
    const { data, error: signUpError } = await signUp(email, password);
    
    if (signUpError) {
      return { error: signUpError };
    }

    if (!data?.user) {
      return { error: new Error("Falha ao criar usuário") };
    }

    // Assign admin role
    const { error: roleError } = await assignRole(data.user.id, "admin");
    
    if (roleError) {
      return { error: roleError };
    }

    // Refresh admin check
    await refreshAdminCheck();

    toast({
      title: "Administrador criado!",
      description: "Faça login para acessar o PDV",
    });

    return { error: null };
  };

  // Redirect customers to home after showing message
  const handleRedirectToHome = () => {
    signOut();
    navigate("/");
  };

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - show PDV login
  if (!user) {
    return (
      <PdvLogin 
        onLogin={signIn} 
        onSetupAdmin={handleSetupAdmin}
        showSetup={!hasAnyAdmin}
      />
    );
  }

  // Logged in but NOT a PDV user (customer trying to access PDV)
  if (!isPdvUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Área Restrita
          </h1>
          <p className="text-muted-foreground mb-2">
            Esta área é exclusiva para operadores e administradores do PDV.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Se você é cliente, utilize o site principal para fazer seus pedidos.
            Se você deveria ter acesso, entre em contato com o administrador.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleRedirectToHome} variant="default">
              Voltar ao Site Principal
            </Button>
            <Button 
              onClick={() => signOut()} 
              variant="ghost"
              className="text-muted-foreground"
            >
              Sair e usar outra conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized PDV user (admin or operator)
  return (
    <PdvDashboard 
      user={user} 
      role={role!} 
      onLogout={signOut}
      onUpdatePassword={updatePassword}
      onCreateUser={createUserWithRole}
      onRemoveRole={removeRole}
    />
  );
}
