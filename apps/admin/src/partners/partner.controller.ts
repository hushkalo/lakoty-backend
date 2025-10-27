import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { PartnerService } from "./partner.service";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { JwtGuard } from "../guards/jwt.guard";
import { UpdatePartnerDto } from "./dto/update-partner.dto";
import { UploadProductsResponseDto } from "./dto/upload-products-response.dto";
import { PartnerDto } from "./dto/partner.dto";
import { ResponseAllPartnerDto } from "./dto/response.dto";

@ApiTags("partners")
@Controller("partners")
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @UseGuards(JwtGuard)
  @Post()
  @ApiOperation({ summary: "Create a new partner" })
  @ApiResponse({ status: 201, description: "Partner successfully created" })
  @ApiResponse({ status: 400, description: "Bad request" })
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnerService.create(createPartnerDto);
  }

  @UseGuards(JwtGuard)
  @Get()
  @ApiOperation({ summary: "Get all partners" })
  @ApiQuery({
    name: "skip",
    required: false,
    description: "Number of records to skip",
  })
  @ApiQuery({
    name: "take",
    required: false,
    description: "Number of records to take",
  })
  @ApiQuery({
    name: "orderBy",
    required: false,
    enum: ["asc", "desc"],
    description: "Sort order",
  })
  @ApiResponse({
    status: 200,
    description: "List of partners",
    type: ResponseAllPartnerDto,
  })
  findAll(
    @Query("skip") skip: string,
    @Query("take") take: string,
    @Query("orderBy") orderBy: "asc" | "desc",
  ) {
    return this.partnerService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      orderBy: {
        createdAt: orderBy || "desc",
      },
    });
  }

  @UseGuards(JwtGuard)
  @Get(":id")
  @ApiOperation({ summary: "Get partner by ID" })
  @ApiParam({ name: "id", description: "Partner ID" })
  @ApiResponse({ status: 200, description: "Partner found", type: PartnerDto })
  @ApiResponse({ status: 404, description: "Partner not found" })
  findOne(@Param("id") id: string) {
    return this.partnerService.findOne({
      where: { id },
    });
  }

  @UseGuards(JwtGuard)
  @Patch(":id")
  @ApiOperation({ summary: "Update partner by ID" })
  @ApiParam({ name: "id", description: "Partner ID" })
  @ApiResponse({ status: 200, description: "Partner successfully updated" })
  @ApiResponse({ status: 404, description: "Partner not found" })
  update(@Body() updatePartnerDto: UpdatePartnerDto, @Param("id") id: string) {
    return this.partnerService.update({
      where: { id },
      data: updatePartnerDto,
    });
  }

  @UseGuards(JwtGuard)
  @Delete(":id")
  @ApiOperation({ summary: "Delete partner by ID" })
  @ApiParam({ name: "id", description: "Partner ID" })
  @ApiResponse({ status: 200, description: "Partner successfully deleted" })
  @ApiResponse({ status: 404, description: "Partner not found" })
  remove(@Param("id") id: string) {
    return this.partnerService.remove({
      where: { id },
    });
  }

  // @UseGuards(JwtGuard)
  @Post(":id/upload-products")
  @ApiOperation({
    summary: "Upload products from partner API",
    description:
      "Synchronizes products from the partner's API. Creates new products and updates existing ones based on keyCrmId.",
  })
  @ApiParam({ name: "id", description: "Partner ID" })
  @ApiResponse({
    status: 200,
    description: "Products successfully synchronized",
    type: UploadProductsResponseDto,
  })
  @ApiResponse({ status: 404, description: "Partner not found" })
  @ApiResponse({ status: 500, description: "Error during synchronization" })
  uploadNewProducts(
    @Param("id") id: string,
  ): Promise<UploadProductsResponseDto> {
    return this.partnerService.uploadPartnerProducts(id);
  }
}
