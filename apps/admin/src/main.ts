import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json } from "express";
import cookieParser from "cookie-parser";
import { WinstonModule } from "nest-winston";
import { instance } from "@shared/logger";
import { ConfigService } from "@nestjs/config";
import { EnvironmentVariablesForAdmin } from "@shared/configuration";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
  });

  const configService = app.get(ConfigService<EnvironmentVariablesForAdmin>);

  app.setGlobalPrefix("api/admin");
  if (
    configService.get("NODE_ENV") === "development" ||
    configService.get("NODE_ENV") === "stage"
  ) {
    instance.debug("Swagger enabled");
    app.enableCors({
      methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
      origin: ["http://localhost:5173", "http://localhost:4173"],
      credentials: true,
    });
    const config = new DocumentBuilder()
      .setTitle("Lakoty Store API")
      .setDescription("The Lakoty Store API description")
      .setVersion("0.1")
      .addServer("http://localhost:8080")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("/api/admin/swagger", app, document, {
      jsonDocumentUrl: "/api/admin/swagger/json",
    });
  } else {
    app.enableCors({
      methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
      origin: [configService.get("CORS_ORIGIN")],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  }
  app.use(json({ limit: configService.get("BODY_LIMIT") || "1mb" }));
  app.use(cookieParser());
  await app.listen(configService.get("BASE_PORT"));
  instance.log({
    message: `Application is running on: ${await app.getUrl()} time: ${new Date(
      new Date().toLocaleString("ua-Ua", {
        timeZone: "Europe/Kiev",
      }),
    ).toLocaleString()}`,
    level: "info",
  });
}

bootstrap().catch((error: Error) => {
  instance.log({
    message: `Error during application bootstrap: ${error.message}`,
    level: "error",
  });
});
