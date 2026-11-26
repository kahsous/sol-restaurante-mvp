export interface Neighborhood {
  id: string;
  name: string;
  delivery_fee: number;
  is_active: boolean;
}

export interface Address {
  id: string;
  user_id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood_id: string;
  neighborhood?: Neighborhood;
  city: string;
  state: string;
  zip_code?: string;
  is_default: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
}

export type PaymentMethod = "pix" | "credit_card" | "debit_card" | "cash" | "voucher";

export interface CheckoutData {
  address: Address;
  paymentMethod: PaymentMethod;
  cashChange?: number;
  notes?: string;
}
