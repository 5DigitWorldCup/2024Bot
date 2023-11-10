import Logger from "@common/Logger";
import path from "path";
import { readdirSync } from "fs";
import { CONFIG } from "config";
import { WebSocket } from "ws";
import ApiEvent from "./interfaces/ApiEvent";

export default class ApiWorker {
  protected logger = Logger(module);
  readonly ws = new WebSocket(`ws://${CONFIG.Api.BaseUrl}/ws/discord/`);

  constructor() {}

  async init(): Promise<void> {
    await this.bindEvents(path.join(__dirname, "events"));
    this.openSocket();
  }

  private async bindEvents(dir: string): Promise<void> {
    const files = readdirSync(dir);

    for (const f of files) {
      const fPath = path.join(dir, f);
      const evModule = await import(fPath);
      const ev: ApiEvent = evModule.default;
      // Attach logger to each event module
      ev.logger = Logger(fPath);

      if (ev.once) {
        this.ws.once(ev.name.toString(), (...args) => ev.execute(...args));
      } else {
        this.ws.on(ev.name.toString(), (...args) => ev.execute(...args));
      }
    }
    this.logger.info("Websocket now listening for events");
  }

  private openSocket(): void {}
}
