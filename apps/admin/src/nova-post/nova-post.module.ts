import { Module } from "@nestjs/common";
import { NovaPostService } from "./nova-post.service";
import { NovaPostController } from "./nova-post.controller";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EnvironmentVariablesForAdmin } from "@shared/configuration";

@Module({
  controllers: [NovaPostController],
  providers: [NovaPostService],
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentVariablesForAdmin>,
      ) => ({
        baseURL: configService.get("NOVA_POST_API_URL"),
      }),
    }),
  ],
})
export class NovaPostModule {}
