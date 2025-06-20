import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";
import Redis from "ioredis";
import { EnvironmentVariablesForStore } from "@shared/configuration";

@Module({})
export class RedisModule {
  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [
        RedisService,
        {
          provide: "REDIS_CLIENT",
          useFactory: (
            configService: ConfigService<EnvironmentVariablesForStore>,
          ) => {
            return new Redis({
              host: configService.get("REDIS_HOST"),
              port: configService.get("REDIS_PORT"),
            });
          },
          inject: [ConfigService],
        },
      ],
      exports: [RedisService],
      global: true,
    };
  }
}
