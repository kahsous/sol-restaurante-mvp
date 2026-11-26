import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, ChefHat, UserPlus, LogIn, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(8, "Senha deve ter no mínimo 8 caracteres");
const setupPasswordSchema = passwordSchema
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número");

interface PdvLoginProps {
  onLogin: (email: string, password: string) => Promise<{ error: Error | null; emailNotConfirmed?: boolean }>;
  onSetupAdmin?: (email: string, password: string) => Promise<{ error: Error | null }>;
  showSetup?: boolean;
}

export function PdvLogin({ onLogin, onSetupAdmin, showSetup = false }: PdvLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(showSetup);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const { toast } = useToast();

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      (isSetupMode ? setupPasswordSchema : passwordSchema).parse(password);
    } catch (err) {
      const zodError = err as z.ZodError;
      toast({
        title: "Dados inválidos",
        description: zodError.errors?.[0]?.message || "Verifique o email e a senha",
        variant: "destructive",
      });
      return false;
    }

    if (isSetupMode && password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A confirmação de senha deve ser igual à senha",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleResendConfirmation = async () => {
    if (!pendingEmail) return;

    setResendingEmail(true);
    const redirectUrl = `${window.location.origin}/admin/pdv`;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
      options: { emailRedirectTo: redirectUrl },
    });

    setResendingEmail(false);

    if (error) {
      toast({ title: "Erro ao reenviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email reenviado!", description: "Verifique sua caixa de entrada" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setShowEmailNotConfirmed(false);

    try {
      if (isSetupMode && onSetupAdmin) {
        const { error } = await onSetupAdmin(email, password);
        if (error) {
          toast({
            title: "Erro ao criar administrador",
            description: error.message || "Tente novamente",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Administrador criado!",
            description: "Verifique seu email para confirmar a conta",
          });
        }
      } else {
        const result = await onLogin(email.trim(), password);
        if (result.emailNotConfirmed) {
          setPendingEmail(email.trim());
          setShowEmailNotConfirmed(true);
        } else if (result.error) {
          toast({
            title: "Erro no login",
            description: result.error.message || "Email ou senha incorretos",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ChefHat className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">
            {isSetupMode ? "Configuração Inicial" : "PDV - Sol Nascente"}
          </CardTitle>
          <CardDescription>
            {isSetupMode ? "Crie a conta de administrador para começar" : "Acesso restrito a operadores"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showEmailNotConfirmed && (
            <Alert className="mb-4 border-primary/30 bg-primary/5">
              <Mail className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <p className="font-medium">Email não confirmado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Verifique sua caixa de entrada em <strong>{pendingEmail}</strong> para confirmar sua conta.
                </p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-2"
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail}
                >
                  {resendingEmail ? (
                    <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Reenviando...</>
                  ) : "Reenviar email de confirmação"}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={isSetupMode ? "admin@exemplo.com" : "operador@exemplo.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {!isSetupMode && (
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSetupMode ? "new-password" : "current-password"}
              />
              {isSetupMode && (
                <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, 1 maiúscula e 1 número</p>
              )}
            </div>

            {isSetupMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSetupMode ? "Criando..." : "Entrando..."}</>
              ) : isSetupMode ? (
                <><UserPlus className="mr-2 h-4 w-4" />Criar Administrador</>
              ) : (
                <><LogIn className="mr-2 h-4 w-4" />Entrar</>
              )}
            </Button>
          </form>

          {showSetup && !isSetupMode && (
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setIsSetupMode(true)} className="text-sm text-primary hover:underline">
                Primeira vez? Configure o administrador
              </button>
            </div>
          )}

          {showSetup && isSetupMode && (
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setIsSetupMode(false)} className="text-sm text-muted-foreground hover:underline">
                Já tenho uma conta
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <ForgotPasswordDialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} />
    </div>
  );
}
