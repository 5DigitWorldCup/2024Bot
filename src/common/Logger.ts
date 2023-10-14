import * as winston from "winston";
import { createLogger, transports, format } from "winston";
import Module from "module";
import path from "path";

/*
  TODO:
  Potentially stream log output to the db
  Potentially automatically backup logs
*/
const seperateModName = format(info => {
  info.moduleName = info.metadata.moduleName;
  delete info.metadata.moduleName;
  return info
})

const logger = createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  transports: [
    new transports.File({
      dirname: "logs",
      filename: "bot.log",
      maxsize: 5000000,
      maxFiles: 6,
      format: format.combine(format.json()),
    }),
    new transports.Console({
      format: format.combine(
        // Unfortunately this doesn't work on my machine for some reason I will investigate
        // not that it matters too much as the file version is most important
        // format.colorize(),
        format.printf(({ timestamp, level, message, moduleName, metadata }) => {
          const mdata = Object.keys(metadata).length === 0 ? "" : JSON.stringify(metadata)
          return `[${timestamp} ${level.toUpperCase()}] <${moduleName}> ${message} ${mdata}`;
        }),
      ),
    }),
  ],
  format: format.combine(
    format.metadata(), format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), seperateModName()
  ),
});

export type Logger = winston.Logger

/**
 * Works akin to a loggerFactory. Creates child loggers on a per module basis
 * 
 * @param arg Either the file path of the module, or the literal module object
 * @returns A child logger formatted with the name of the module
 * @example
 * const log = Logger(module)
 * const log = Logger(fPath)
 */
function createChildLogger(arg: Module | string): Logger {
  const toParse = (arg instanceof Module)
    ? arg.id
    : arg
  return logger.child({ moduleName: path.parse(toParse).name })
}

export default createChildLogger