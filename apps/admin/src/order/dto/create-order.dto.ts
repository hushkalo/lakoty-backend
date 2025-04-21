export class CreateOrderDto {
  products: {
    productId: string;
    name: string;
    size: {
      productSizeId: string;
      name: string;
      limit: number;
    };
    price: number;
    discount: number;
    alias: string;
    image: string;
    quantity: number;
    sku?: string;
  }[];
}
