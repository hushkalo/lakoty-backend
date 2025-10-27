export type TSize = {
  keyCrmId: number;
  name: string;
  quantity: number;
  isAvailable: boolean;
  sku: string;
};

export type TCategory = {
  id: number;
  name: string;
  parent_id: number | null;
};

export type TProduct = {
  id: number;
  name: string;
  description: string | null;
  thumbnail_url: string;
  attachments_data: string[];
  quantity: number;
  unit_type: string | null;
  in_reserve: number;
  currency_code: string;
  min_price: number;
  max_price: number;
  weight: number;
  length: number;
  height: number;
  width: number;
  has_offers: boolean;
  is_archived: boolean;
  category_id: number;
  created_at: string;
  updated_at: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  purchased_price: number;
  sources: any[];
};

export type TOffer = {
  id: number;
  product_id: number;
  sku: string;
  barcode: string | null;
  thumbnail_url: string | null;
  price: number;
  purchased_price: number;
  quantity: number;
  in_reserve: number;
  weight: number | null;
  length: number | null;
  height: number | null;
  width: number | null;
  properties: Array<{
    name: string;
    value: string;
  }>;
  is_default: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type TResponse<T> = {
  data: T[];
  total: number;
};
