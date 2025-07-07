import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
  constructor(@Inject("REDIS_CLIENT") private readonly redisClient: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);

    if (!data) return null;

    return JSON.parse(data) as T;
  }

  async set<T>(key: string, value: T, expirySeconds?: number): Promise<void> {
    if (expirySeconds) {
      await this.redisClient.setex(key, expirySeconds, JSON.stringify(value));
    } else {
      await this.redisClient.set(key, JSON.stringify(value));
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redisClient.keys(pattern);
  }
}
