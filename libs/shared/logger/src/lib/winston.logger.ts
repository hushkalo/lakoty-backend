import { createLogger, format, transports } from "winston";
import { utilities as nestWinstonModuleUtilities } from "nest-winston";

// custom log display format
const customFormat = format.printf(({ timestamp, level, stack, message }) => {
  return `${timestamp} - [${level.toUpperCase().padEnd(7)}] - ${stack || message}`;
});

const options = {
  file: {
    filename: "error.log",
    level: "error",
  },
  console: {
    level: "silly",
  },
};

// for development environment
const devLogger = {
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    customFormat,
    nestWinstonModuleUtilities.format.nestLike("next", {
      colors: true,
      prettyPrint: true,
    }),
  ),
  transports: [new transports.Console(options.console)],
};

// for production environment
const prodLogger = {
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [
    new transports.File(options.file),
    new transports.File({
      filename: "combine.log",
      level: "info",
    }),
  ],
};

// export log instance based on the current environment
const instanceLogger =
  process.env["NODE_ENV"] === "production" ? prodLogger : devLogger;

export const instance = createLogger(instanceLogger);
