import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from "@nestjs/swagger";
import { BasketService } from "./basket.service";
import { BasketItemDto, DefaultMessageDto } from "./dto/basket.dto";

@ApiTags("Basket")
@Controller("basket")
export class BasketController {
  constructor(private readonly basketService: BasketService) {}

  @Get()
  @ApiOperation({ summary: "Get basket items by sessionId" })
  @ApiQuery({ name: "sessionId", type: String })
  @ApiResponse({ status: 200, type: [BasketItemDto] })
  get(@Query("sessionId") sessionId: string): Promise<BasketItemDto[]> {
    return this.basketService.getBasket(sessionId);
  }

  @Post("add")
  @ApiOperation({ summary: "Add or update an item in the basket" })
  @ApiQuery({ name: "sessionId", type: String })
  @ApiBody({ type: BasketItemDto })
  @ApiResponse({ status: 200, type: [BasketItemDto] })
  add(
    @Query("sessionId") sessionId: string,
    @Body() item: BasketItemDto,
  ): Promise<BasketItemDto[]> {
    return this.basketService.addOrUpdateItem(sessionId, item);
  }

  @Patch("quantity")
  @ApiOperation({ summary: "Update quantity of a basket item" })
  @ApiQuery({ name: "sessionId", type: String })
  @ApiQuery({ name: "productId", type: String })
  @ApiQuery({ name: "sizeId", type: String })
  @ApiQuery({ name: "quantity", type: Number })
  @ApiResponse({ status: 200, type: [BasketItemDto] })
  updateQuantity(
    @Query("sessionId") sessionId: string,
    @Query("productId") productId: string,
    @Query("sizeId") sizeId: string,
    @Query("quantity") quantity: string,
  ): Promise<BasketItemDto[]> {
    return this.basketService.updateQuantity(
      sessionId,
      productId,
      sizeId,
      +quantity,
    );
  }

  @Delete("remove")
  @ApiOperation({ summary: "Remove an item from the basket" })
  @ApiQuery({ name: "sessionId", type: String })
  @ApiQuery({ name: "productId", type: String })
  @ApiQuery({ name: "sizeName", type: String })
  @ApiResponse({ status: 200, type: [BasketItemDto] })
  remove(
    @Query("sessionId") sessionId: string,
    @Query("productId") productId: string,
    @Query("sizeName") sizeName: string,
  ): Promise<BasketItemDto[]> {
    return this.basketService.removeItem(sessionId, productId, sizeName);
  }

  @Delete("clear")
  @ApiOperation({ summary: "Clear the basket by sessionId" })
  @ApiQuery({ name: "sessionId", type: String })
  @ApiResponse({ status: 200, type: DefaultMessageDto })
  async clear(
    @Query("sessionId") sessionId: string,
  ): Promise<DefaultMessageDto> {
    await this.basketService.clearBasket(sessionId);

    return {
      message: "OK",
    };
  }
}
