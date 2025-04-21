export class DefaultResponseDto<T> {
  data: T;
}

export class GetFindCityResponse {
  id: string;
  name: string;
  region: string;
}

export class GetFindWarehouseResponse {
  id: string;
  name: string;
  address: string;
  categoryOfWarehouse: "Branch" | "Postomat";
  numberWarehouse: string;
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
  CategoryOfWarehouse: "Branch" | "Postomat";
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
