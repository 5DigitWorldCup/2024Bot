import * as winston from "winston";
import Transport from "winston-transport";
import { createLogger, transports, format, transport } from "winston";
import Module from "module";
import path from "path";
import fs from "fs";
import ExtendedClient from "@discord/ExtendedClient";
import CONFIG from "config";
import { EmbedBuilder, codeBlock } from "discord.js";

const seperateModName = format(info => {
  info.moduleName = info.metadata.moduleName;
  delete info.metadata.moduleName;
  return info;
});

const logDir = path.resolve("logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

enum LogLevels {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3,
}

enum LogLevelColors {
  debug = "LightGrey",
  info = "Grey",
  warn = "Orange",
  error = "Red",
}

interface LogMessage {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  metadata: any;
  moduleName: string;
}

/**
 * Custom winston transport that routes logs through discord channels
 */
export class DiscordTransport extends Transport {
  private readonly client: ExtendedClient;
  private readonly verboseChannelId: string;
  private readonly generalChannelId: string;
  /**
   * Amount of chars in `info.metadata` before truncating
   */
  private static readonly MAX_META_CHARS = 1700;

  constructor(opts: transport.TransportStreamOptions & { client: ExtendedClient }) {
    super(opts);
    const { client } = opts;
    this.client = client;
    this.verboseChannelId = CONFIG.Logging.Verbose;
    this.generalChannelId = CONFIG.Logging.General;
  }

  log(info: LogMessage, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });
    // Determine channel from log level
    const channelId = LogLevels[info.level] >= LogLevels.warn ? this.verboseChannelId : this.generalChannelId;
    // Build log message
    const embed = new EmbedBuilder()
      .setColor(LogLevelColors[info.level])
      .addFields(
        { name: "Level", value: info.level.toUpperCase(), inline: true },
        { name: "Origin", value: info.moduleName, inline: true },
        { name: "Message", value: info.message },
      )
      .setTimestamp();

    if (info.metadata) {
      try {
        const meta = codeBlock(
          "json",
          JSON.stringify(info.metadata, null, "\t").substring(0, DiscordTransport.MAX_META_CHARS),
        );
        embed.addFields({ name: "Metadata", value: meta });
      } catch (err) {
        console.error(err);
      }
    }

    if (this.client.isReady()) {
      this.client.channels
        .fetch(channelId)
        .then(channel => {
          if (channel?.isTextBased()) {
            channel.send({ embeds: [embed] });
          }
        })
        .catch(console.error);
    }
    if (callback) {
      callback();
    }
  }
}

export const parentLogger = createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  transports: [
    new transports.File({
      dirname: logDir,
      filename: "bot.log",
      maxsize: 5000000,
      maxFiles: 6,
      format: format.combine(format.json()),
    }),
    new transports.Console({
      format: format.combine(
        format.printf(({ timestamp, level, message, moduleName, metadata }) => {
          const mdata = Object.keys(metadata).length === 0 ? "" : JSON.stringify(metadata);
          return `[${timestamp} ${level.toUpperCase()}] <${moduleName}> ${message} ${mdata}`;
        }),
      ),
    }),
  ],
  format: format.combine(format.metadata(), format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), seperateModName()),
});

export type Logger = winston.Logger;

/**
 * Works akin to a loggerFactory. Creates child loggers on a per module basis
 *
 * @param arg Either the file path of the module, or the literal module object
 * @returns A child logger formatted with the name of the module
 * @example
 * const log = Logger(module)
 * const log = Logger(fPath)
 */
export default function createChildLogger(arg: Module | string): Logger {
  const toParse = arg instanceof Module ? arg.id : arg;
  return parentLogger.child({ moduleName: path.parse(toParse).name });
}
