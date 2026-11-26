import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Company, CompanyConsumption } from "@/types/company";
import { useToast } from "@/hooks/use-toast";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [consumption, setConsumption] = useState<CompanyConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Erro ao carregar empresas", variant: "destructive" });
    } else {
      setCompanies(data as Company[]);
    }
    setLoading(false);
  }, [toast]);

  const fetchConsumption = useCallback(async () => {
    const { data, error } = await supabase
      .from("company_consumption")
      .select("*")
      .order("company_name");

    if (!error && data) {
      setConsumption(data as CompanyConsumption[]);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const createCompany = async (company: Omit<Company, "id" | "created_at" | "updated_at">) => {
    const { error } = await supabase.from("companies").insert(company);
    if (error) {
      toast({ title: "Erro ao criar empresa", description: error.message, variant: "destructive" });
      return { error };
    }
    toast({ title: "Empresa cadastrada!" });
    fetchCompanies();
    return { error: null };
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    const { error } = await supabase.from("companies").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar empresa", description: error.message, variant: "destructive" });
      return { error };
    }
    toast({ title: "Empresa atualizada!" });
    fetchCompanies();
    return { error: null };
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateCompany(id, { is_active: !isActive });
  };

  return {
    companies,
    consumption,
    loading,
    fetchCompanies,
    fetchConsumption,
    createCompany,
    updateCompany,
    toggleActive,
  };
}
