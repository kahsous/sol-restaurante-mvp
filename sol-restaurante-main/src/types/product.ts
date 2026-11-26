export interface Category {
  id: string;
  name: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export type ProductAvailability = "restaurant" | "delivery" | "both";

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_pequena: number;
  price_media: number;
  price_grande: number;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  track_stock: boolean;
  stock_quantity: number | null;
  sold_by_weight: boolean;
  price_per_kg: number | null;
  availability: ProductAvailability;
  availability_pequena: ProductAvailability;
  availability_media: ProductAvailability;
  availability_grande: ProductAvailability;
  cost_price: number | null;
  price_multiplier: number | null;
  option_groups_count?: number;
  is_combo?: boolean;
  serves?: number | null;
  sale_start?: string | null;
  sale_end?: string | null;
  combo_items?: ComboItem[];
}

export interface ComboItem {
  product_id: string;
  quantity: number;
}

export interface ProductFormData {
  name: string;
  description: string;
  category_id: string;
  price_pequena: number;
  price_media: number;
  price_grande: number;
  is_active: boolean;
  is_featured: boolean;
  track_stock: boolean;
  stock_quantity: number | null;
  sold_by_weight: boolean;
  price_per_kg: number | null;
  availability: ProductAvailability;
  availability_pequena: ProductAvailability;
  availability_media: ProductAvailability;
  availability_grande: ProductAvailability;
  cost_price: number | null;
  price_multiplier: number | null;
  is_combo: boolean;
  serves: number | null;
  sale_start: string | null;
  sale_end: string | null;
  combo_items: ComboItem[];
}


export interface PrinterConfig {
  id: string;
  name: string;
  model: string;
  connection_type: string;
  address: string | null;
  port: number | null;
  is_active: boolean;
  print_kitchen_ticket: boolean;
  print_receipt: boolean;
  created_at: string;
  updated_at: string;
}
