import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json } from "express";
import * as cookieParser from "cookie-parser";
import { WinstonModule } from "nest-winston";
import { instance } from "./logger/winston.logger";
import {
  BASE_PORT,
  CONFIGURATION_NODE_ENV,
  getCorsOptions,
  validateConfiguration,
} from "./configuration";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
  });

  const PORT = BASE_PORT;
  if (
    CONFIGURATION_NODE_ENV === "development" ||
    CONFIGURATION_NODE_ENV === "stage"
  ) {
    app.enableCors(getCorsOptions());
    const config = new DocumentBuilder()
      .setTitle("Lakoty Store API")
      .setDescription("The Lakoty Store API description")
      .setVersion("0.1")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);
  }

  if (CONFIGURATION_NODE_ENV === "production") {
    app.enableCors(getCorsOptions());
  }

  app.use(json({ limit: process.env.BODY_LIMIT || "1mb" }));
  app.use(cookieParser());
  await app.listen(PORT);
  validateConfiguration();
  instance.log({
    message: `Application is running on: ${await app.getUrl()} time: ${new Date(
      new Date().toLocaleString("ua-Ua", {
        timeZone: "Europe/Kiev",
      }),
    ).toLocaleString()}`,
    level: "info",
  });
}

bootstrap().catch((error) => {
  instance.log({
    message: `Error during application bootstrap: ${error.message}`,
    level: "error",
  });
});
