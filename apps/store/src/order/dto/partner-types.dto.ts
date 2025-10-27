import { Partners, Product } from "@libs/prisma-client";

// Типы для работы с партнерами и продуктами
export interface ProductWithPartner extends Product {
  Partner: Partners | null;
}

export interface OrderProductWithData {
  productId: string;
  name: string;
  size?: {
    id?: string;
    name: string;
    sku?: string;
  };
  price: number;
  discount: number;
  alias: string;
  image: string;
  quantity: number;
  sku?: string;
  productData: ProductWithPartner;
}

export interface PartnerWithProducts {
  partner: Partners;
  products: OrderProductWithData[];
}

export interface CrmOrderResponse {
  id: number;
}

export interface CrmOrderPayment {
  id: number;
  status: string;
  amount: number;
}

export interface CrmOrderDetails {
  id: number;
  payments: CrmOrderPayment[];
}
