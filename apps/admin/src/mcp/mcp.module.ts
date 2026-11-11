import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "@libs/prisma-client";
import { ProductsModule } from "../products/products.module";
import { CategoriesModule } from "../categories/categories.module";
import { PartnerModule } from "../partners/partner.module";
import { McpController } from "./mcp.controller";
import { McpApiKeyGuard } from "./mcp-api-key.guard";
import { McpUserService } from "./mcp-user.service";
import { McpOAuthService } from "./oauth/mcp-oauth.service";
import { ProductsMcpTools } from "./tools/products.tools";
import { CategoriesMcpTools } from "./tools/categories.tools";
import { PartnersMcpTools } from "./tools/partners.tools";

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    PrismaModule,
    ProductsModule,
    CategoriesModule,
    PartnerModule,
  ],
  controllers: [McpController],
  providers: [
    McpApiKeyGuard,
    McpUserService,
    McpOAuthService,
    ProductsMcpTools,
    CategoriesMcpTools,
    PartnersMcpTools,
  ],
  exports: [McpOAuthService],
})
export class McpModule {}
