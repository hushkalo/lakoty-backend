import { Module } from '@nestjs/common';
import { OrderController } from './order/order.controller';
import { OrderModule } from './order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [OrderController],
})
export class CourseModule {}
