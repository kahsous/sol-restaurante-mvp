import type { CartItem } from "./menu";

export type OrderSource = "online" | "whatsapp" | "ifood" | "pdv";
export type OrderStatus = "pending" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";

export interface Order {
  id: string;
  source: OrderSource;
  external_id?: string; // Para iFood
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  external_data?: Record<string, any>;
}

export interface OnlineOrderPayload {
  items: CartItem[];
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
}
