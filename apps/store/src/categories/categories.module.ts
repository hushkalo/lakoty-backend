import { Logger, Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { PrismaModule } from "@libs/prisma-client";

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, Logger],
  exports: [CategoriesService],
})
export class CategoriesModule {}
