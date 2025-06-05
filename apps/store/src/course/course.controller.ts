import { Controller, Get } from "@nestjs/common";
import { CourseService } from "./course.service";

@Controller("course")
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get("quantity")
  getCourseQuantity() {
    return this.courseService.getCourseQuantity();
  }
}
