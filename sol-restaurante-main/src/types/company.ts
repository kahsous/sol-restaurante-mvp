export interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  contact_person: string | null;
  phone: string | null;
  monthly_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyConsumption {
  company_id: string;
  company_name: string;
  cnpj: string | null;
  monthly_limit: number;
  month: string | null;
  order_count: number;
  total_consumed: number;
}
