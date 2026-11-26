import type { CartItem } from "./menu";

export type TabStatus = "free" | "open" | "consuming" | "awaiting_payment" | "finalized";

export interface Tab {
  id: string;
  tab_number: number;
  code: string;
  status: TabStatus;
  items: CartItem[];
  subtotal: number;
  notes: string | null;
  customer_name: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  created_by: string | null;
  company_id: string | null;
}

export const TAB_STATUS_LABELS: Record<TabStatus, string> = {
  free: "Livre",
  open: "Aberta",
  consuming: "Em Consumo",
  awaiting_payment: "Aguardando Pagamento",
  finalized: "Finalizada",
};

export const TAB_STATUS_COLORS: Record<TabStatus, string> = {
  free: "bg-muted text-muted-foreground",
  open: "bg-blue-500 text-white",
  consuming: "bg-green-500 text-white",
  awaiting_payment: "bg-yellow-500 text-white",
  finalized: "bg-gray-400 text-white",
};
