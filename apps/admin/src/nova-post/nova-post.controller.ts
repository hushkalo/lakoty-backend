import { Controller, Get, Query } from "@nestjs/common";
import { NovaPostService } from "./nova-post.service";
import {
  DefaultResponseDto,
  GetFindCityResponse,
  GetFindWarehouseResponse,
} from "@shared/types";

@Controller("nova-post")
export class NovaPostController {
  constructor(private readonly novaPostService: NovaPostService) {}

  @Get("find/cities")
  getCities(
    @Query("searchCityName") searchCityName: string,
  ): Promise<DefaultResponseDto<GetFindCityResponse[]>> {
    return this.novaPostService.getCities({
      searchCityName,
    });
  }
  @Get("find/warehouses")
  getWarehouses(
    @Query("searchWarehouseName") searchWarehouseName: string,
    @Query("cityRef") cityRef: string,
  ): Promise<DefaultResponseDto<GetFindWarehouseResponse[]>> {
    return this.novaPostService.getWarehouses({
      searchWarehouseName,
      cityRef,
    });
  }
}
