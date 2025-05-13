import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderResponseDto {
  @ApiProperty({
    description: "Order unique identifier",
    example: "clhlw1mlq0000ksvm3gfy3eur",
    type: String,
  })
  id: string;

  @ApiProperty({
    description: "Customer first name",
    example: "John",
    type: String,
  })
  firstName: string;

  @ApiProperty({
    description: "Customer second name",
    example: "Smith",
    type: String,
  })
  secondName: string;

  @ApiProperty({
    description: "Customer patronymic name",
    example: "Alexander",
    type: String,
  })
  patronymic: string;

  @ApiProperty({
    description: "Customer phone number",
    example: "+380501234567",
    type: String,
  })
  phoneNumber: string;

  @ApiProperty({ description: "Delivery city", example: "Kyiv", type: String })
  city: string;

  @ApiProperty({
    description: "Warehouse street address",
    example: "Main Street",
    type: String,
  })
  warehouseAddress: string;

  @ApiProperty({ description: "Warehouse number", example: "12", type: String })
  warehouseNumber: string;

  @ApiProperty({
    description: "Type of warehouse",
    example: "Post Office",
    type: String,
  })
  warehouseType: string;

  @ApiProperty({
    description: "Messenger contact",
    example: "@username",
    type: String,
  })
  messenger: string;

  @ApiProperty({
    description: "City reference ID",
    example: "cityRef123",
    type: String,
  })
  cityRef: string;

  @ApiProperty({
    description: "Warehouse reference ID",
    example: "warehouseRef456",
    type: String,
  })
  warehouseRef: string;

  @ApiProperty({ description: "Payment type", example: "CASH", type: String })
  paymentType: string;

  @ApiProperty({
    description: "Type of messenger",
    example: "TELEGRAM",
    type: String,
  })
  messengerType: string;

  @ApiProperty({
    description: "City area/district",
    example: "Podilskyi",
    type: String,
  })
  cityArea: string;

  @ApiProperty({
    description: "Order creation timestamp",
    example: "2024-02-20T10:30:00Z",
    type: String,
  })
  createdAt: string;

  @ApiProperty({
    description: "Order last update timestamp",
    example: "2024-02-20T10:35:00Z",
    type: String,
  })
  updatedAt: string;
}
