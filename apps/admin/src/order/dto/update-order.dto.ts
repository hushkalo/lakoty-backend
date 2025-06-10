import { ApiProperty } from "@nestjs/swagger";
import {
  MessengerType,
  CreateOrderProductDto,
  PaymentType,
} from "./create-order.dto";
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class UpdateOrderProductDto extends CreateOrderProductDto {
  @ApiProperty({
    description: "Order product ID",
    example: "clhlw1mlq0000ksvm3gfy3eur",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  orderProductId: string;
}

export class UpdateOrderDto {
  @ApiProperty({
    description: "Customer first name",
    example: "John",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  firstName: string;

  @ApiProperty({
    description: "Customer second name",
    example: "Smith",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  secondName: string;

  @ApiProperty({
    description: "Customer patronymic name",
    example: "Alexander",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  patronymic: string;

  @ApiProperty({
    description: "Customer phone number",
    example: "+380501234567",
    required: false,
  })
  @IsString()
  @Matches(/^\+[0-9]{12}$/, {
    message: "Phone number must be in format +380XXXXXXXXX",
  })
  phoneNumber: string;

  @ApiProperty({
    description: "Delivery city",
    example: "Kyiv",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  city: string;

  @ApiProperty({
    description: "Warehouse street address",
    example: "Main Street",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  warehouseAddress: string;

  @ApiProperty({
    description: "Warehouse number",
    example: "12",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  warehouseNumber: string;

  @ApiProperty({
    description: "Type of warehouse",
    example: "Post Office",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  warehouseType: string;

  @ApiProperty({
    description: "Messenger contact",
    example: "@username",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  messenger: string;

  @ApiProperty({
    description: "City reference ID",
    example: "cityRef123",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  cityRef: string;

  @ApiProperty({
    description: "Warehouse reference ID",
    example: "warehouseRef456",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  warehouseRef: string;

  @ApiProperty({
    description: "Payment type",
    example: "CASH",
    enum: PaymentType,
    required: false,
  })
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType: PaymentType;

  @ApiProperty({
    description: "Type of messenger",
    example: "TELEGRAM",
    enum: MessengerType,
    required: false,
  })
  @IsEnum(MessengerType)
  @IsOptional()
  messengerType: MessengerType;

  @ApiProperty({
    description: "City area/district",
    example: "Podilskyi",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  cityArea: string;

  @ApiProperty({
    description: "Flag to indicate if customer should be called",
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  callCustomer: boolean;

  @ApiProperty({ type: [UpdateOrderProductDto], required: false })
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderProductDto)
  @ArrayNotEmpty()
  @IsOptional()
  orderProducts: UpdateOrderProductDto[];
}
