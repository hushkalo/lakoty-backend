export type ResponseDataType<T> = {
  data: T;
  total: number;
  to: number;
};

export type TKeyCRMOrder = {
  id: number;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  attachments_data: any[];
  quantity: number;
  unit_type: string | null;
  in_reserve: number;
  currency_code: string;
  min_price: number;
  max_price: number;
  weight: number;
  length: number | null;
  height: number | null;
  width: number | null;
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

export type TKeyCRMAddFile = {
  id: number;
  size: number;
  file_name: string;
  directory: string;
  extension: string;
  original_file_name: string;
  mime_type: string;
  created_at: string;
  updated_at: string;
  url: string;
};
