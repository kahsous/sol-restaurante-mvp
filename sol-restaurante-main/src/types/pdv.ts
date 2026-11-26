import type { CartItem } from "./menu";
import type { PaymentMethod } from "./delivery";

export type OrderStatus = "pending" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "completed" | "cancelled";
export type DeliveryType = "own" | "third_party";

export interface Order {
  id: string;
  user_id: string | null;
  address_id: string | null;
  neighborhood_id: string | null;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: PaymentMethod;
  cash_change: number | null;
  notes: string | null;
  status: OrderStatus;
  delivery_type: DeliveryType | null;
  created_at: string;
  // Guest order fields
  guest_name: string | null;
  guest_phone: string | null;
  guest_address_street: string | null;
  guest_address_number: string | null;
  guest_address_complement: string | null;
  guest_neighborhood_name: string | null;
  pix_receipt_url: string | null;
  // Origin tracking
  source?: string | null;
  external_id?: string | null;
  external_data?: any;
  pickup_code?: string | null;
  // Registered user address (from join)
  address?: {
    street: string;
    number: string;
    complement: string | null;
    neighborhood?: {
      name: string;
    };
  };
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Novo",
  preparing: "Em Preparo",
  ready: "Pronto",
  out_for_delivery: "Saiu p/ Entrega",
  delivered: "Entregue",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-500",
  preparing: "bg-blue-500",
  ready: "bg-green-500",
  out_for_delivery: "bg-purple-500",
  delivered: "bg-teal-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-500",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  cash: "Dinheiro",
  voucher: "Vale Refeição/Alimentação",
};

// Delivery statuses (for delivery orders)
export const DELIVERY_STATUS_FLOW: OrderStatus[] = ["pending", "preparing", "ready", "out_for_delivery", "delivered", "completed"];
// Pickup/standard statuses
export const PICKUP_STATUS_FLOW: OrderStatus[] = ["pending", "preparing", "ready", "completed"];

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  own: "Entrega Própria",
  third_party: "Entrega Terceirizada",
};
