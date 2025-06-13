import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json } from "express";
import cookieParser from "cookie-parser";
import { WinstonModule } from "nest-winston";
import { instance } from "@shared/logger";
import { ConfigService } from "@nestjs/config";
import { EnvironmentVariablesForStore } from "@shared/configuration";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
  });

  const configService = app.get(ConfigService<EnvironmentVariablesForStore>);
  app.use(json({ limit: configService.get("BODY_LIMIT") || "1mb" }));
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  if (
    configService.get("NODE_ENV") === "development" ||
    configService.get("NODE_ENV") === "stage"
  ) {
    app.enableCors({
      methods: ["GET", "POST"],
      origin: [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
      ],
    });
    const config = new DocumentBuilder()
      .setTitle("Lakoty Store API")
      .setDescription("The Lakoty Store API description")
      .setVersion("0.1")
      .addServer("http://localhost:8080")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/swagger", app, document, {
      jsonDocumentUrl: "api/swagger/json",
    });
  }

  const origins: string[] = (await configService.get("CORS_ORIGIN")).split(",");
  app.enableCors({
    methods: ["GET", "POST"],
    origin: origins,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.set("query parser", "extended");
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
