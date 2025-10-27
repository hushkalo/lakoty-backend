import { Logger, Module } from "@nestjs/common";
import { TasksService } from "./task.service";
import { OrderModule } from "../order/order.module";
import { PartnerModule } from "../partners/partner.module";

@Module({
  imports: [OrderModule, PartnerModule],
  providers: [TasksService, Logger],
})
export class TasksModule {}
