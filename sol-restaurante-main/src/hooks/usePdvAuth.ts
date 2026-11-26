import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "operator" | "cozinha" | "estoque" | "super_admin";

interface PdvAuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isPdvUser: boolean;
  hasAnyAdmin: boolean;
  checkingAdmin: boolean;
}

const isPdvRole = (role: AppRole | null) =>
  role === "admin" || role === "operator" || role === "super_admin";

async function getUserRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "operator", "super_admin"])
    .order("id", { ascending: true })
    .limit(1);

  if (error) {
    console.error("Erro ao carregar função do usuário:", error);
    return null;
  }

  return (data?.[0]?.role as AppRole | undefined) ?? null;
}

export function usePdvAuth() {
  const [state, setState] = useState<PdvAuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
    isPdvUser: false,
    hasAnyAdmin: true,
    checkingAdmin: true,
  });

  const checkHasAdmin = useCallback(async () => {
    const { data, error } = await supabase.rpc("has_any_admin");
    setState((prev) => ({
      ...prev,
      hasAnyAdmin: error ? true : Boolean(data),
      checkingAdmin: false,
    }));
  }, []);

  const applySession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setState((prev) => ({
        ...prev,
        user: null,
        session: null,
        role: null,
        loading: false,
        isPdvUser: false,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      user: session.user,
      session,
      loading: true,
    }));

    const role = await getUserRole(session.user.id);

    setState((prev) => ({
      ...prev,
      user: session.user,
      session,
      role,
      loading: false,
      isPdvUser: isPdvRole(role),
    }));
  }, []);

  useEffect(() => {
    checkHasAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Defer the database query so auth callbacks stay lightweight.
        setTimeout(() => {
          void applySession(session);
        }, 0);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session);
    });

    return () => subscription.unsubscribe();
  }, [applySession, checkHasAdmin]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (data?.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return {
        error: new Error("EMAIL_NOT_CONFIRMED"),
        emailNotConfirmed: true,
      };
    }

    return { error, emailNotConfirmed: false };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/admin/pdv`;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const assignRole = async (userId: string, role: AppRole) => {
    const { data: existing, error: lookupError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .order("id", { ascending: true })
      .limit(1);

    if (lookupError) return { error: lookupError };

    if (existing?.[0]) {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("id", existing[0].id);
      return { error };
    }

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });
    return { error };
  };

  const removeRole = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    return { error };
  };

  const createUserWithRole = async (
    email: string,
    password: string,
    userRole: AppRole = "operator"
  ) => {
    const { data, error: signUpError } = await signUp(email, password);

    if (signUpError || !data.user) {
      return { error: signUpError || new Error("Falha ao criar usuário") };
    }

    const { error: roleError } = await assignRole(data.user.id, userRole);
    if (roleError) return { error: roleError };

    return { error: null, userId: data.user.id };
  };

  const createOperator = (email: string, password: string) =>
    createUserWithRole(email, password, "operator");

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    updatePassword,
    assignRole,
    removeRole,
    createOperator,
    createUserWithRole,
    refreshAdminCheck: checkHasAdmin,
  };
}
