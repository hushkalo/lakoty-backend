class Buyer {
  full_name: string;
  email: string;
  phone: string;
}

class Shipping {
  delivery_service_id: string;
  shipping_service: string;
  shipping_address_city: string;
  shipping_address_country: string;
  shipping_address_region: string;
  shipping_address_zip: string;
  recipient_full_name: string;
  recipient_phone: string;
  warehouse_ref: string;
}

class Payment {
  payment_method_id: string;
  payment_method: string;
  amount: string;
  description: string;
  payment_date: string;
  status: string;
}

class Property {
  name: string;
  value: string;
}

class Product {
  sku: string;
  price: number;
  quantity: number;
  properties: Property[];
  name: string;
  picture: string;
}

export class CreateOrderCrmDto {
  manager_id: number;
  source_id: number;
  buyer_comment: string;
  buyer: Buyer;
  shipping: Shipping;
  payments: Payment[];
  products: Product[];
}
