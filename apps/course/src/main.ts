import { NestFactory } from '@nestjs/core';
import { CourseModule } from './course.module';
import { PORT } from '@/shared/constants';

async function bootstrap() {
  const app = await NestFactory.create(CourseModule);
  await app.listen(PORT);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
