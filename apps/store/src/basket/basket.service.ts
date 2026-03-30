import { Injectable } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";
import { BasketItemDto } from "./dto/basket.dto";

@Injectable()
export class BasketService {
  constructor(private readonly redis: RedisService) {}

  private getKey(sessionId: string) {
    return `basket:${sessionId}`;
  }

  async getBasket(sessionId: string): Promise<BasketItemDto[]> {
    const data = await this.redis.get<BasketItemDto[]>(this.getKey(sessionId));

    if (!data) {
      await this.setBasket(sessionId, []);
      return [];
    }

    return data;
  }

  async setBasket(sessionId: string, items: BasketItemDto[]) {
    await this.redis.set(this.getKey(sessionId), items, 3 * 60 * 60);
  }

  async clearBasket(sessionId: string): Promise<void> {
    await this.redis.del(this.getKey(sessionId));
  }

  async addOrUpdateItem(
    sessionId: string,
    newItem: BasketItemDto,
  ): Promise<BasketItemDto[]> {
    const basket = await this.getBasket(sessionId);
    const existing = basket.find(
      (i) => i.productId === newItem.productId && i.size.id === newItem.size.id,
    );

    let updatedBasket: BasketItemDto[];

    if (existing) {
      updatedBasket = basket.map((i) => {
        return i.productId === newItem.productId &&
          i.size.id === newItem.size.id
          ? { ...i, quantity: i.quantity + 1 }
          : i;
      });
    } else {
      updatedBasket = [...basket, newItem];
    }

    await this.setBasket(sessionId, updatedBasket);
    return updatedBasket;
  }

  async removeItem(
    sessionId: string,
    productId: string,
    sizeName: string,
  ): Promise<BasketItemDto[]> {
    const basket = await this.getBasket(sessionId);
    const filtered = basket.filter((i) => {
      return !(i.productId === productId && i.size.name === sizeName);
    });
    await this.setBasket(sessionId, filtered);
    return filtered;
  }

  async updateQuantity(
    sessionId: string,
    productId: string,
    sizeId: string,
    quantity: number,
  ): Promise<BasketItemDto[]> {
    const basket = await this.getBasket(sessionId);
    const updated = basket.map((i) =>
      i.productId === productId && i.size.id === sizeId
        ? { ...i, quantity }
        : i,
    );
    await this.setBasket(sessionId, updated);
    return updated;
  }
}
