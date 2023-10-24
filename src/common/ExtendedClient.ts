import { Client, ClientOptions, Collection, REST, Routes } from "discord.js";
import { CONFIG } from "config";
import Command from "@interfaces/Command";
import Event from "@interfaces/Event";
import fs from "fs";
import path from "path";
import Logger from "./Logger";

export default class ExtendedClient extends Client {
  commands: Collection<string, Command> = new Collection();
  logger = Logger(module);

  constructor(options: ClientOptions) {
    super(options);
  }

  async init(): Promise<void> {
    this.commands = await ExtendedClient.loadCommands(path.join(__dirname, "..", "commands"));
    this.logger.info(`Collected ${this.commands.size} command modules`);
    this.initEvents(path.join(__dirname, "..", "events"));
  }

  /**
   * Creates a collection of command modules from `dir`
   * @param dir directory to search for command modules in
   */
  static async loadCommands(dir: string): Promise<Collection<string, Command>> {
    let commands = new Collection<string, Command>();
    const files = fs.readdirSync(dir);

    for (const f of files) {
      const fpath = path.join(dir, f);

      if (fs.lstatSync(fpath).isDirectory()) {
        // Recursively load commands in subdirs
        const nest = await this.loadCommands(fpath);
        commands = commands.concat(nest);
      } else {
        // Push command data to the client
        const cModule = await import(fpath);
        const c: Command = cModule.default;

        if (!c.data || !c.execute) continue;
        // Attach filePath and Logger to each module
        c.filePath = fpath;
        c.logger = Logger(fpath);
        commands.set(c.data.name, c);
      }
    }
    return commands;
  }

  /**
   * Deploys application commands to the guild specified in config
   */
  static async deployCommands(): Promise<string> {
    const rest = new REST({ version: "10" }).setToken(CONFIG.Bot.Token);
    const commands = await this.loadCommands(path.join(__dirname, "..", "commands"));
    const data = commands.map(c => c.data.toJSON());

    await rest.put(Routes.applicationGuildCommands(CONFIG.Bot.ClientId, CONFIG.Bot.GuildId), { body: data });
    return `Successfully deployed ${data.length} application commands to Guild.`;
  }

  /**
   * Clears all application commands registered to the guild specified in config
   */
  static async clearCommands(): Promise<string> {
    const rest = new REST({ version: "10" }).setToken(CONFIG.Bot.Token);

    await rest.put(Routes.applicationGuildCommands(CONFIG.Bot.ClientId, CONFIG.Bot.GuildId), { body: [] });
    return `Successfully cleared all application commands from Guild.`;
  }

  /**
   * Subscribes to client events
   * @param dir directory to search for event modules files in
   */
  private async initEvents(dir: string): Promise<void> {
    const files = fs.readdirSync(dir);

    for (const f of files) {
      const fPath = path.join(dir, f);
      const evModule = await import(fPath);
      const ev: Event = evModule.default;
      // Attach logger to each event module
      ev.logger = Logger(fPath);

      if (ev.once) {
        this.once(ev.name, (...args) => ev.execute(...args));
      } else {
        this.on(ev.name, (...args) => ev.execute(...args));
      }
    }
    this.logger.info("Now listening for events");
  }
}
