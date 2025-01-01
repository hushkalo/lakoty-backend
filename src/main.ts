import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import {
  BUILD_IMAGES_DIRECTORY_PATH,
  CORS_ORIGIN,
  MAIN_STATIC_DIRECTORY_NAME,
  MAIN_STATIC_DIRECTORY_PATH,
} from "./constants/constant";
import { json, static as expressStatic } from "express";
import * as cookieParser from "cookie-parser";
import { WinstonModule } from "nest-winston";
import { instance } from "./logger/winston.logger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
  });
  const PORT = process.env.BASE_PORT || 3000;
  const staticDir = MAIN_STATIC_DIRECTORY_PATH;
  const categoryImagesDir = BUILD_IMAGES_DIRECTORY_PATH("category");
  const productImagesDir = BUILD_IMAGES_DIRECTORY_PATH("product");
  if (!existsSync(staticDir)) {
    mkdirSync(staticDir);
  }
  if (!existsSync(categoryImagesDir)) {
    mkdirSync(categoryImagesDir);
  }
  if (!existsSync(productImagesDir)) {
    mkdirSync(productImagesDir);
  }
  app.enableCors({
    origin: ["http://localhost:5173", CORS_ORIGIN],
    methods: "POST",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle("Lakoty Store API")
    .setDescription("The Lakoty Store API description")
    .setVersion("0.1")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);
  app.use(
    `/${MAIN_STATIC_DIRECTORY_NAME}`,
    expressStatic(join(process.cwd(), MAIN_STATIC_DIRECTORY_NAME)),
  );
  app.use(json({ limit: process.env.BODY_LIMIT || "1mb" }));
  app.use(cookieParser());
  await app.listen(PORT);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
