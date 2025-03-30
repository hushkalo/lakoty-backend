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
