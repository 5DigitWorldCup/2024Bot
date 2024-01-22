import { Client, ClientOptions, Collection, REST, Routes } from "discord.js";
import CONFIG from "@/config";
import Command from "@discord/interfaces/Command";
import DiscordEvent from "@discord/interfaces/DiscordEvent";
import fs from "fs";
import path from "path";
import CreateLogger, { Logger } from "@common/Logger";
import ApiWorker from "@api/ApiWorker";
import AutoNameService from "@discord/services/AutoNameService";

export default class ExtendedClient extends Client {
  /**
   * Discord `Collection` of <`Command Name`, `Command Data`>
   */
  public commands: Collection<string, Command> = new Collection();
  private logger!: Logger;
  public apiWorker!: ApiWorker;
  public autoNameService!: AutoNameService;

  constructor(options: ClientOptions) {
    super(options);
  }

  public async init(): Promise<void> {
    this.logger = CreateLogger(module);
    this.apiWorker = new ApiWorker(this);
    this.autoNameService = new AutoNameService(this);

    this.commands = await ExtendedClient.loadCommands(path.join(__dirname, "commands"));
    await this.bindEvents(path.join(__dirname, "events"));

    await this.apiWorker.init();
  }

  /**
   * Creates a collection of command modules from `dir`
   * @param dir directory to search for command modules in
   */
  public static async loadCommands(dir: string): Promise<Collection<string, Command>> {
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
        c.logger = CreateLogger(fpath);
        commands.set(c.data.name, c);
      }
    }
    return commands;
  }

  /**
   * Deploys application commands to the guild specified in config
   */
  public static async deployCommands(): Promise<string> {
    const rest = new REST({ version: "10" }).setToken(CONFIG.Bot.Token);
    const commands = await this.loadCommands(path.join(__dirname, "commands"));
    const data = commands.map(c => c.data.toJSON());

    await rest.put(Routes.applicationGuildCommands(CONFIG.Bot.ClientId, CONFIG.Bot.GuildId), { body: data });
    return `Successfully deployed ${data.length} application commands to Guild.`;
  }

  /**
   * Clears all application commands registered to the guild specified in config
   */
  public static async clearCommands(): Promise<string> {
    const rest = new REST({ version: "10" }).setToken(CONFIG.Bot.Token);

    await rest.put(Routes.applicationGuildCommands(CONFIG.Bot.ClientId, CONFIG.Bot.GuildId), { body: [] });
    return `Successfully cleared all application commands from Guild.`;
  }

  /**
   * Subscribes to client events
   * @param dir directory to search for event modules files in
   */
  private async bindEvents(dir: string): Promise<void> {
    const files = fs.readdirSync(dir);

    for (const f of files) {
      const fPath = path.join(dir, f);
      const evModule = await import(fPath);
      const ev: DiscordEvent = evModule.default;
      // Attach logger to each event module
      ev.logger = this.logger.child({ moduleName: `ExtendedClient:${ev.name}` });

      if (ev.once) {
        this.once(ev.name.toString(), (...args) => ev.execute(...args));
      } else {
        this.on(ev.name.toString(), (...args) => ev.execute(...args));
      }
    }
    this.logger.info("Now listening for events");
  }
}
