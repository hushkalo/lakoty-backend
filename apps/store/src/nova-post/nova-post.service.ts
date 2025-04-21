import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { EnvironmentVariablesForStore } from "@shared/configuration";
import { DefaultBodyNovaPostDto } from "@shared/types";
import {
  NovaPostCityDto,
  NovaPostResponseDto,
  NovaPostWarehouseDto,
} from "@shared/types";
import {
  DefaultResponseDto,
  GetFindCityResponse,
  GetFindWarehouseResponse,
} from "@shared/types";

@Injectable()
export class NovaPostService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<EnvironmentVariablesForStore>,
  ) {}

  async getCities(params: {
    searchCityName: string;
  }): Promise<DefaultResponseDto<GetFindCityResponse[]>> {
    const body: DefaultBodyNovaPostDto<"getCities"> = {
      apiKey: this.configService.get("NOVA_POST_API_KEY"),
      modelName: "AddressGeneral",
      calledMethod: "getCities",
      methodProperties: {
        FindByString: params.searchCityName,
        Page: "1",
        Limit: "20",
      },
    };
    const responseCities = await this.httpService.axiosRef.post<
      NovaPostResponseDto<NovaPostCityDto>
    >(this.configService.get("NOVA_POST_API_URL"), body);
    const prettyCities = responseCities.data.data.map<GetFindCityResponse>(
      (city) => ({
        id: city.Ref,
        name: city.Description,
        region: city.AreaDescription,
      }),
    );
    return {
      data: prettyCities,
    };
  }
  async getWarehouses(params: {
    searchWarehouseName: string;
    cityRef: string;
  }): Promise<DefaultResponseDto<GetFindWarehouseResponse[]>> {
    const body: DefaultBodyNovaPostDto<"getWarehouses"> = {
      apiKey: process.env.NOVA_POST_API_KEY,
      modelName: "AddressGeneral",
      calledMethod: "getWarehouses",
      methodProperties: {
        CityRef: params.cityRef,
        FindByString: params.searchWarehouseName,
        Page: "1",
        Limit: "20",
      },
    };

    const responseWarehouse = await this.httpService.axiosRef.post<
      NovaPostResponseDto<NovaPostWarehouseDto>
    >(this.configService.get("NOVA_POST_API_URL"), body);
    const prettyWarehouse =
      responseWarehouse.data.data.map<GetFindWarehouseResponse>(
        (warehouse) => ({
          id: warehouse.Ref,
          name: warehouse.Description,
          address: warehouse.ShortAddress,
          categoryOfWarehouse: warehouse.CategoryOfWarehouse,
          numberWarehouse: warehouse.Number,
        }),
      );
    return {
      data: prettyWarehouse,
    };
  }
}
