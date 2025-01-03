import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PORT } from "@shared/constants";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();