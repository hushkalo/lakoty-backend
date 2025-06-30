import { Logger, Module } from "@nestjs/common";
import { TasksService } from "./task.service";
import { OrderModule } from "../order/order.module";

@Module({
  imports: [OrderModule],
  providers: [TasksService, Logger],
})
export class TasksModule {}
