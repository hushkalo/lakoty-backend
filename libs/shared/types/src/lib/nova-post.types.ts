import { ApiProperty } from "@nestjs/swagger";

export class GetFindCityResponse {
  @ApiProperty({
    description: "Unique identifier of the city",
    example: "8d5a980d-391c-11dd-90d9-001a92567626",
  })
  id: string;

  @ApiProperty({
    description: "Name of the city",
    example: "Київ",
  })
  name: string;

  @ApiProperty({
    description: "Region/oblast where the city is located",
    example: "Київська область",
  })
  region: string;
}

export class GetFindWarehouseResponse {
  @ApiProperty({
    description: "Unique identifier of the warehouse",
    example: "1ec09d88-e1c2-11e3-8c4a-0050568002cf",
  })
  id: string;

  @ApiProperty({
    description: "Name of the warehouse",
    example: "Відділення №1",
  })
  name: string;

  @ApiProperty({
    description: "Physical address of the warehouse",
    example: "вул. Хрещатик, 22",
  })
  address: string;

  @ApiProperty({
    description: "Category of the warehouse",
    enum: ["Branch", "Postomat", "Store"],
    example: "Branch",
  })
  categoryOfWarehouse: "Branch" | "Postomat" | "Store";

  @ApiProperty({
    description: "Warehouse number",
    example: "1",
  })
  numberWarehouse: string;
}

export class FindCityResponseDto {
  @ApiProperty({ type: [GetFindCityResponse], description: "List of cities" })
  data: GetFindCityResponse[];
}

export class FindWarehouseResponseDto {
  @ApiProperty({
    type: [GetFindWarehouseResponse],
    description: "List of warehouses",
  })
  data: GetFindWarehouseResponse[];
}

export class NovaPostResponseDto<T> {
  success: boolean;
  data: T[];
  errors: unknown[];
  warnings: unknown[];
  info: {
    totalCount: number;
  };
  messageCodes: unknown[];
  errorCodes: unknown[];
  warningCodes: unknown[];
  infoCodes: unknown[];
}

export class NovaPostCityDto {
  Description: string;
  DescriptionRu: string;
  Ref: string;
  Delivery1: string;
  Delivery2: string;
  Delivery3: string;
  Delivery4: string;
  Delivery5: string;
  Delivery6: string;
  Delivery7: string;
  Area: string;
  SettlementType: string;
  IsBranch: string;
  PreventEntryNewStreetsUser: string;
  CityID: string;
  SettlementTypeDescriptionRu: string;
  SettlementTypeDescription: string;
  SpecialCashCheck: number;
  AreaDescription: string;
  AreaDescriptionRu: string;
}

export class NovaPostWarehouseDto {
  SiteKey: string;
  Description: string;
  DescriptionRu: string;
  ShortAddress: string;
  ShortAddressRu: string;
  Phone: string;
  TypeOfWarehouse: string;
  Ref: string;
  Number: string;
  CityRef: string;
  CityDescription: string;
  CityDescriptionRu: string;
  SettlementRef: string;
  SettlementDescription: string;
  SettlementAreaDescription: string;
  SettlementRegionsDescription: string;
  SettlementTypeDescription: string;
  SettlementTypeDescriptionRu: string;
  Longitude: string;
  Latitude: string;
  PostFinance: string;
  BicycleParking: string;
  PaymentAccess: string;
  POSTerminal: string;
  InternationalShipping: string;
  SelfServiceWorkplacesCount: string;
  TotalMaxWeightAllowed: string;
  PlaceMaxWeightAllowed: string;
  SendingLimitationsOnDimensions: {
    Width: number;
    Height: number;
    Length: number;
  };
  ReceivingLimitationsOnDimensions: {
    Width: number;
    Height: number;
    Length: number;
  };
  Reception: {
    Monday: string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;
  };
  Delivery: {
    Monday: string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;
  };
  Schedule: {
    Monday: string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;
  };
  DistrictCode: string;
  WarehouseStatus: string;
  WarehouseStatusDate: string;
  WarehouseIllusha: string;
  CategoryOfWarehouse: "Branch" | "Postomat" | "Store";
  Direct: string;
  RegionCity: string;
  WarehouseForAgent: string;
  GeneratorEnabled: string;
  MaxDeclaredCost: string;
  WorkInMobileAwis: string;
  DenyToSelect: string;
  CanGetMoneyTransfer: string;
  HasMirror: string;
  HasFittingRoom: string;
  OnlyReceivingParcel: string;
  PostMachineType: string;
  PostalCodeUA: string;
  WarehouseIndex: string;
  BeaconCode: string;
  Location: string;
  PostomatFor: string;
}

export type TCalledMethod = "getCities" | "getWarehouses";
type TModelName = "AddressGeneral";

export class DefaultBodyNovaPostDto<T extends TCalledMethod> {
  apiKey: string;
  modelName: TModelName;
  calledMethod: TCalledMethod;
  methodProperties: T extends "getCities"
    ? { Limit: string; Page: string; FindByString: string }
    : { FindByString: string; CityRef: string; Limit: string; Page: string };
}
