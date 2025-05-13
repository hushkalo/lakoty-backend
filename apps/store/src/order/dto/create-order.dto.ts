import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsUrl,
  IsOptional,
  ValidateNested,
  ArrayNotEmpty,
  Matches,
  IsEnum,
  IsDefined,
} from "class-validator";
import { IsCUID } from "../../validations/is-cuid.validation";

export enum PaymentType {
  PREPAY = "PREPAY",
  POSTPAY = "POSTPAY",
}

export enum MessengerType {
  TELEGRAM = "TELEGRAM",
  VIBER = "VIBER",
  WHATSAPP = "WHATSAPP",
  INSTAGRAM = "INSTAGRAM",
}

class CreateOrderProductSizeDto {
  @ApiProperty({
    description: "Product size ID",
    example: "clhlw1mlq0000ksvm3gfy3eur",
  })
  @IsString()
  @IsNotEmpty()
  @IsCUID({ message: "productId must be a valid CUID" })
  productSizeId: string;

  @ApiProperty({ description: "Size name", example: "Large" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Size limit", example: 10 })
  @IsNumber()
  @Min(0)
  limit: number;
}

class OrderProductDto {
  @ApiProperty({
    description: "Product ID",
    example: "clhlw1mlq0000ksvm3gfy3eur",
  })
  @IsString()
  @IsNotEmpty()
  @IsCUID({
    message: "productId must be a valid CUID",
  })
  productId: string;

  @ApiProperty({ description: "Product name", example: "T-Shirt" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: CreateOrderProductSizeDto })
  @ValidateNested()
  @Type(() => CreateOrderProductSizeDto)
  @IsDefined({ message: "size must be provided" })
  size: CreateOrderProductSizeDto;

  @ApiProperty({ description: "Product price", example: 29.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: "Product discount", example: 0 })
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiProperty({ description: "Product alias", example: "black-tshirt" })
  @IsString()
  @IsNotEmpty()
  alias: string;

  @ApiProperty({
    description: "Product image URL",
    example: "https://example.com/image.jpg",
  })
  @IsUrl()
  image: string;

  @ApiProperty({ description: "Product quantity", example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: "Product SKU",
    required: false,
    example: "SKU123",
  })
  @IsOptional()
  @IsString()
  sku?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: "Customer first name", example: "John" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: "Customer second name", example: "Smith" })
  @IsString()
  @IsNotEmpty()
  secondName: string;

  @ApiProperty({
    description: "Customer patronymic name",
    example: "Alexander",
  })
  @IsString()
  @IsNotEmpty()
  patronymic: string;

  @ApiProperty({
    description: "Customer phone number",
    example: "+380501234567",
  })
  @IsString()
  @Matches(/^\+[0-9]{12}$/, {
    message: "Phone number must be in format +380XXXXXXXXX",
  })
  phoneNumber: string;

  @ApiProperty({ description: "Delivery city", example: "Kyiv" })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: "Warehouse street address",
    example: "Main Street",
  })
  @IsString()
  @IsNotEmpty()
  warehouseAddress: string;

  @ApiProperty({ description: "Warehouse number", example: "12" })
  @IsString()
  @IsNotEmpty()
  warehouseNumber: string;

  @ApiProperty({ description: "Type of warehouse", example: "Post Office" })
  @IsString()
  @IsNotEmpty()
  warehouseType: string;

  @ApiProperty({ description: "Messenger contact", example: "@username" })
  @IsString()
  @IsNotEmpty()
  messenger: string;

  @ApiProperty({ description: "City reference ID", example: "cityRef123" })
  @IsString()
  @IsNotEmpty()
  cityRef: string;

  @ApiProperty({
    description: "Warehouse reference ID",
    example: "warehouseRef456",
  })
  @IsString()
  @IsNotEmpty()
  warehouseRef: string;

  @ApiProperty({ description: "Payment type", example: "CASH" })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ description: "Type of messenger", example: "TELEGRAM" })
  @IsEnum(MessengerType)
  messengerType: MessengerType;

  @ApiProperty({ description: "City area/district", example: "Podilskyi" })
  @IsString()
  @IsNotEmpty()
  cityArea: string;

  @ApiProperty({ type: [OrderProductDto] })
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  @ArrayNotEmpty()
  orderProducts: OrderProductDto[];
}
