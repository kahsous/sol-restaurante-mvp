export interface ScaleConfig {
  id: string;
  name: string;
  port: string;
  baud_rate: number;
  protocol: "toledo" | "filizola" | "urano";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeightReading {
  weight_kg: number;
  stable: boolean;
  timestamp: Date;
}

export interface WeightSaleItem {
  product_id: string;
  product_name: string;
  weight_kg: number;
  price_per_kg: number;
  total: number;
}
