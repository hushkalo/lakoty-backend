import { Controller, Get, Param, Query } from "@nestjs/common";
import { BrandService } from "./brand.service";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
  ApiInternalServerErrorResponse,
} from "@nestjs/swagger";
import { BrandResponseDto } from "./dto/responses.dto";
import { BrandDto } from "./dto/brand.dto";
import { AppError, ErrorModel } from "@shared/error-model";

@ApiTags("Brands")
@Controller("brands")
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @ApiOperation({ summary: "Get all root brands (paginated, searchable)" })
  @ApiQuery({
    name: "take",
    required: false,
    type: Number,
    description: "Limit the number of results",
  })
  @ApiQuery({
    name: "skip",
    required: false,
    type: Number,
    description: "Number of items to skip",
  })
  @ApiQuery({
    name: "searchString",
    required: false,
    type: String,
    description: "Name search filter",
  })
  @ApiQuery({
    name: "categoryId",
    required: false,
    type: String,
    description: "Filter with category ID",
  })
  @ApiResponse({
    status: 200,
    description: "List of brands.",
    type: BrandResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  getAllBrands(
    @Query("take") take?: number,
    @Query("skip") skip?: number,
    @Query("searchString") searchString?: string,
    @Query("categoryId") categoryId?: string,
  ): Promise<BrandResponseDto> {
    return this.brandService.findAll({
      take: take ? +take : undefined,
      skip: skip ? +skip : undefined,
      where: {
        Product: {
          some: categoryId && {
            categoryId: categoryId,
          },
        },
        name: {
          contains: searchString,
          mode: "insensitive",
        },
      },
      orderBy: [
        {
          name: "desc",
        },
      ],
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a brand by its ID" })
  @ApiParam({ name: "id", required: true, description: "Category ID" })
  @ApiResponse({
    status: 200,
    description: "The requested brand.",
    type: BrandDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  getBrand(@Param("id") id: string) {
    return this.brandService.findOne({
      where: { id },
    });
  }
}
