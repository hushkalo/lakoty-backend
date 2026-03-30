import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { NovaPostService } from "./nova-post.service";
import { FindCityResponseDto, FindWarehouseResponseDto } from "@shared/types";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtGuard } from "../guards/jwt.guard";

@ApiTags("Nova Post")
@Controller("nova-post")
export class NovaPostController {
  constructor(private readonly novaPostService: NovaPostService) {}

  @Get("find/cities")
  @ApiOperation({ summary: "Search for cities by name" })
  @ApiQuery({
    name: "searchCityName",
    description: "Search query for city name",
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "List of cities matching search query",
    type: FindCityResponseDto,
  })
  @UseGuards(JwtGuard)
  getCities(
    @Query("searchCityName") searchCityName: string,
  ): Promise<FindCityResponseDto> {
    return this.novaPostService.getCities({
      searchCityName,
    });
  }

  @Get("find/warehouses")
  @ApiOperation({ summary: "Search for warehouses in a city" })
  @ApiQuery({
    name: "searchWarehouseName",
    description: "Search query for warehouse name",
    required: true,
    type: String,
  })
  @ApiQuery({
    name: "cityRef",
    description: "Reference ID of the city",
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "List of warehouses matching search query",
    type: FindWarehouseResponseDto,
  })
  @UseGuards(JwtGuard)
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
