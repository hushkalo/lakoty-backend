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
