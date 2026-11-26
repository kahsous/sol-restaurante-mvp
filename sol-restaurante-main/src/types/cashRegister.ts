export type CashRegisterStatus = "open" | "closed";
export type MovementType = "sale" | "withdrawal" | "deposit" | "change";
export type PaymentMethodType = "cash" | "credit_card" | "debit_card" | "pix" | "voucher";

export interface CashRegister {
  id: string;
  user_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  expected_balance: number | null;
  status: CashRegisterStatus;
  notes: string | null;
  created_at: string;
}

export interface CashMovement {
  id: string;
  cash_register_id: string;
  order_id: string | null;
  type: MovementType;
  payment_method: PaymentMethodType;
  amount: number;
  description: string | null;
  drawer_opened: boolean;
  created_at: string;
}

export const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethodType,
  { label: string; icon: string; opensDrawer: boolean; requiresTerminal: boolean }
> = {
  cash: { label: "Dinheiro", icon: "💵", opensDrawer: true, requiresTerminal: false },
  credit_card: { label: "Crédito", icon: "💳", opensDrawer: false, requiresTerminal: true },
  debit_card: { label: "Débito", icon: "💳", opensDrawer: false, requiresTerminal: true },
  pix: { label: "PIX", icon: "📱", opensDrawer: false, requiresTerminal: false },
  voucher: { label: "Vale Refeição", icon: "🎫", opensDrawer: false, requiresTerminal: true },
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  sale: "Venda",
  withdrawal: "Sangria",
  deposit: "Suprimento",
  change: "Troco",
};
