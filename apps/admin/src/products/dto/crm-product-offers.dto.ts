class ProductProperties {
  name: string;
  value: string;
}

export class CrmProductOffersDto {
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
  properties: ProductProperties[];
  sources: never[];
}
