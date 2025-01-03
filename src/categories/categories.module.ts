import { Logger, Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminCategoriesController } from "./admin-categories.controller";

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService, Logger],
  exports: [CategoriesService],
})
export class CategoriesModule {}
