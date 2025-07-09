export class CreateOrderCrmDto {
  source_id: number;
  buyer_comment: string;
  manager_id: number;
  buyer: BuyerDto;
  shipping: ShippingDto;
  products: ProductDto[];
  payments: PaymentDto[];
}

export class PaymentDto {
  "payment_method_id": number;
  "payment_method": string;
  "amount": number;
  "description": string;
  "status": string;
}

export class BuyerDto {
  full_name: string;
  email: string | null;
  phone: string;
}

export class ShippingDto {
  delivery_service_id: number;
  shipping_service: string;
  shipping_address_city: string;
  shipping_address_country: string;
  shipping_address_region: string;
  shipping_receive_point: string;
  recipient_full_name: string;
  recipient_phone: string;
  warehouse_ref: string;
}

export class ProductDto {
  sku: string;
  price: number;
  discount_percent: number;
  quantity: number;
  unit_type: string;
  name: string;
  picture: string;
  properties: PropertyDto[];
}

export class PropertyDto {
  name: string;
  value: string;
}
