import { Body, Controller, Get, Post } from "@nestjs/common";
import { CourseService } from "./course.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Controller("course")
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post("create")
  createOrder(@Body() data: CreateOrderDto) {
    return this.courseService.create(data);
  }

  @Get("quantity")
  getCourseQuantity() {
    return this.courseService.getCourseQuantity();
  }
}
