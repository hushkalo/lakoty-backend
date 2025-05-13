import { Controller, Get, Query } from "@nestjs/common";
import { NovaPostService } from "./nova-post.service";
import { FindCityResponseDto, FindWarehouseResponseDto } from "@shared/types";

@Controller("nova-post")
export class NovaPostController {
  constructor(private readonly novaPostService: NovaPostService) {}

  @Get("find/cities")
  getCities(
    @Query("searchCityName") searchCityName: string,
  ): Promise<FindCityResponseDto> {
    return this.novaPostService.getCities({
      searchCityName,
    });
  }
  @Get("find/warehouses")
  getWarehouses(
    @Query("searchWarehouseName") searchWarehouseName: string,
    @Query("cityRef") cityRef: string,
  ): Promise<FindWarehouseResponseDto> {
    return this.novaPostService.getWarehouses({
      searchWarehouseName,
      cityRef,
    });
  }
}
