import { ApiProperty, OmitType } from "@nestjs/swagger";
import { ProductDto, ProductSizeDto } from "../../products/dto/product.dto";

export enum MessengerType {
  EMAIL = "EMAIL",
  TELEGRAM = "TELEGRAM",
  VIBER = "VIBER",
  WHATSAPP = "WHATSAPP",
  INSTAGRAM = "INSTAGRAM",
}

export enum PaymentType {
  PREPAY = "PREPAY",
  POSTPAY = "POSTPAY",
}

class OrderProductDetailsDto extends OmitType(ProductDto, [
  "category",
  "_count",
  "productSizes",
]) {}

export class OrderStatusDto {
  @ApiProperty({
    description: "Order status unique identifier",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "Order status name",
    example: "Pending",
    enum: ["new", "in-progress", "completed", "canceled"],
  })
  name: string;
}

export class OrderProductDto {
  @ApiProperty({
    name: "id",
    description: "Order product id",
    example: "op_123",
  })
  id: string;

  @ApiProperty({
    name: "productId",
    description: "Product id",
    example: "prod_123",
  })
  productId: string;

  @ApiProperty({
    name: "orderId",
    description: "Order id",
    example: "ord_123456",
  })
  orderId: string;

  @ApiProperty({ name: "sizeId", description: "Size id", example: "size_1" })
  sizeId: string;

  @ApiProperty({ name: "quantity", description: "Quantity", example: 2 })
  quantity: number;

  @ApiProperty({ name: "price", description: "Price", example: 100 })
  price: number;

  @ApiProperty({ name: "discount", description: "Discount", example: 10 })
  discount: number;

  @ApiProperty({
    name: "createdAt",
    description: "Created at",
    example: "2024-06-04T12:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    name: "updatedAt",
    description: "Updated at",
    example: "2024-06-05T15:30:00.000Z",
  })
  updatedAt: Date;

  @ApiProperty({
    name: "Product",
    description: "Product details",
    type: OrderProductDetailsDto,
  })
  Product: Omit<ProductDto, "category" | "_count" | "productSizes">;

  @ApiProperty({
    name: "ProductSize",
    description: "Product size details",
    type: ProductSizeDto,
  })
  ProductSize: ProductSizeDto;
}

export class OrderDto {
  @ApiProperty({
    description: "Order unique identifier",
    example: "ord_123456",
  })
  id: string;

  @ApiProperty({ description: "Customer's first name", example: "John" })
  firstName: string;

  @ApiProperty({ description: "Customer's second name", example: "Doe" })
  secondName: string;

  @ApiProperty({ description: "Customer's patronymic", example: "Ivanovich" })
  patronymic: string;

  @ApiProperty({
    description: "Customer's phone number",
    example: "+380991234567",
  })
  phoneNumber: string;

  @ApiProperty({ description: "City of delivery", example: "Kyiv" })
  city: string;

  @ApiProperty({ description: "Warehouse address", example: "123 Main St" })
  warehouseAddress: string;

  @ApiProperty({ description: "Warehouse number", example: "15" })
  warehouseNumber: string;

  @ApiProperty({ description: "Type of warehouse", example: "post_office" })
  warehouseType: string;

  @ApiProperty({ description: "Messenger contact", example: "@john_doe" })
  messenger: string;

  @ApiProperty({
    description: "Reference to the city in the delivery system",
    example: "city_ref_001",
  })
  cityRef: string;

  @ApiProperty({
    description: "Reference to the warehouse in the delivery system",
    example: "warehouse_ref_001",
  })
  warehouseRef: string;

  @ApiProperty({
    description: "Type of payment",
    example: "PREPAY",
    enum: PaymentType,
  })
  paymentType: string;

  @ApiProperty({
    description: "Type of messenger",
    example: "telegram",
    enum: MessengerType,
  })
  messengerType: string;

  @ApiProperty({ description: "Area of the city", example: "Shevchenkivskyi" })
  cityArea: string;

  @ApiProperty({ description: "Should the customer be called", example: true })
  callCustomer: boolean;

  @ApiProperty({ description: "Is the order deleted", example: false })
  isDeleted: boolean;

  @ApiProperty({ description: "Order status identifier", example: 1 })
  statusId: number;

  @ApiProperty({
    description: "Order comment",
    example: "Please deliver before 5 PM",
  })
  comment: string;

  @ApiProperty({
    description: "Order products",
    type: [OrderProductDto],
  })
  OrderProduct: OrderProductDto[];

  @ApiProperty({
    description: "Order status name",
    type: OrderStatusDto,
  })
  Status: OrderStatusDto;

  @ApiProperty({
    description: "Count of items in the order",
    example: {
      OrderProduct: 2,
    },
  })
  _count: {
    OrderProduct: number;
  };

  @ApiProperty({
    description: "Order creation date",
    example: "2024-06-04T12:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Order last update date",
    example: "2024-06-05T15:30:00.000Z",
  })
  updatedAt: Date;
}
