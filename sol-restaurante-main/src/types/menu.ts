export type ItemSize = "pequena" | "media" | "grande";

export interface Option {
  id: string;
  name: string;
  priceDelta: number;
  isActive: boolean;
}

export interface OptionGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  displayOrder: number;
  options: Option[];
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  pricePequena: number;
  priceMedia: number;
  priceGrande: number;
  category: string;
  categoryName?: string;
  categoryIcon?: string;
  isFeatured?: boolean;
  trackStock: boolean;
  stockQuantity: number | null;
  availableSizes: ItemSize[];
  optionGroups?: OptionGroup[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  size: ItemSize;
  selectedOptions: SelectedOption[];
  unitPrice: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
