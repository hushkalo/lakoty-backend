import { Controller, Post, Body } from "@nestjs/common";
import { CourseService } from "./course.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { Throttle } from "@nestjs/throttler";
import { HALF_HOUR_IN_MILLISECONDS } from "../constants/constant";

@Controller("course")
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Throttle({ default: { limit: 3, ttl: HALF_HOUR_IN_MILLISECONDS } })
  @Post("create")
  createOrder(@Body() data: CreateOrderDto) {
    return this.courseService.create(data);
  }
}
