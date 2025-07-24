import { ApiProperty } from "@nestjs/swagger";
import { ProductImageDto } from "../../products/dto/product.dto";

class OrderProductDetails {
  @ApiProperty({
    description: "Product name",
  })
  name: string;

  @ApiProperty({
    description: "Product alias",
  })
  alias: string;

  @ApiProperty({
    description: "Product images",
    type: [ProductImageDto],
  })
  images: ProductImageDto[];
}

class OrderProductSizeDetails {
  @ApiProperty({
    description: "Product size",
  })
  name: string;
}

export class OrderProductDto {
  @ApiProperty({
    description: "Unique identifier for the order product",
    example: "prod_12345",
  })
  id: string;

  @ApiProperty({
    description: "Identifier of the associated product",
    example: "item_67890",
  })
  productId: string;

  @ApiProperty({
    description: "Identifier of the associated order",
    example: "order_98765",
  })
  orderId: string;

  @ApiProperty({
    description: "Identifier of the product size, if applicable",
    example: "size_456",
    nullable: true,
  })
  sizeId: string | null;

  @ApiProperty({
    description: "Number of items ordered",
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: "Price per item",
    example: 2999,
  })
  price: number;

  @ApiProperty({
    description: "Discount applied to the item (percent)",
    example: 50,
  })
  discount: number;

  @ApiProperty({
    description: "Timestamp when the order product was created",
    example: "2025-06-18T20:34:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Timestamp when the order product was last updated",
    example: "2025-06-18T20:34:00Z",
  })
  updatedAt: Date;

  @ApiProperty({
    description: "Timestamp when the order product was last updated",
    example: OrderProductDetails,
  })
  Product: OrderProductDetails;

  @ApiProperty({
    description: "Timestamp when the order product was last updated",
    example: OrderProductSizeDetails,
    nullable: true,
  })
  ProductSize: OrderProductSizeDetails | null;
}

export class OrderDto {
  @ApiProperty({
    description: "Unique identifier for the order",
    example: "order_98765",
  })
  id: string;

  @ApiProperty({
    description: "First name of the customer",
    example: "John",
  })
  firstName: string;

  @ApiProperty({
    description: "Second name of the customer",
    example: "Doe",
  })
  secondName: string;

  @ApiProperty({
    description: "Patronymic of the customer",
    example: "Smith",
  })
  patronymic: string;

  @ApiProperty({
    description: "Phone number of the customer",
    example: "+3805067890",
  })
  phoneNumber: string;

  @ApiProperty({
    description: "Type of payment used for the order",
    example: "PREPAY",
  })
  paymentType: string;

  @ApiProperty({
    description: "Type of messenger used for communication",
    example: "WHATSAPP",
  })
  messengerType: string;

  @ApiProperty({
    description: "Key CRM order identifier",
    example: 1001,
  })
  keyCrmOrderId: number;

  @ApiProperty({
    description: "Invoice identifier, if applicable",
    example: "inv_123",
    nullable: true,
  })
  invoiceId: string | null;

  @ApiProperty({
    description: "Flag indicating whether to call the customer",
    example: true,
  })
  callCustomer: boolean;

  @ApiProperty({
    description: "Nova post city",
    example: "Київ",
  })
  city: string;

  @ApiProperty({
    description: "Nova post warehouse address",
    example: "Миньківці, Квітнева, 15А",
  })
  warehouseAddress: string;

  @ApiProperty({
    description: "Nova post warehouse number",
    example: "123",
  })
  warehouseNumber: string;

  @ApiProperty({
    description: "Nova post warehouse type",
    example: "Branch",
  })
  warehouseType: string;

  @ApiProperty({
    description: "Additional comments for the order",
    example: "Please deliver after 5 PM",
  })
  comment: string;

  @ApiProperty({
    description: "Flag indicating if the order is deleted",
    example: false,
  })
  isDeleted: boolean;

  @ApiProperty({
    description: "Status of the order",
    example: "pending",
  })
  status: string;

  @ApiProperty({
    description: "Payment status of the order",
    example: "no_paid",
  })
  paymentStatus: string;

  @ApiProperty({
    description: "Timestamp when the order was created",
    example: "2025-06-18T20:34:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Timestamp when the order was last updated",
    example: "2025-06-18T20:34:00Z",
  })
  updatedAt: Date;

  @ApiProperty({
    description: "List of products associated with the order",
    type: [OrderProductDto],
  })
  OrderProduct: OrderProductDto[];
}
