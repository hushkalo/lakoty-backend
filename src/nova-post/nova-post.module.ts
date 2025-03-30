import { Module } from "@nestjs/common";
import { NovaPostService } from "./nova-post.service";
import { NovaPostController } from "./nova-post.controller";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EnvironmentVariables } from "../config/env.validation";

@Module({
  controllers: [NovaPostController],
  providers: [NovaPostService],
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        baseURL: configService.get("NOVA_POST_API_URL"),
      }),
    }),
  ],
})
export class NovaPostModule {}
