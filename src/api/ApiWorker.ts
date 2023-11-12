import Logger from "@common/Logger";
import path from "path";
import { readdirSync } from "fs";
import { CONFIG } from "config";
import { WebSocket } from "ws";
import ApiEvent from "@api/interfaces/ApiEvent";

export default class ApiWorker {
  protected readonly logger = Logger(module);
  /**
   * Exponential scalar for reconnection timeout
   */
  nReconAttempts = 0;
  /**
   * Delay for periodically refreshing the websocket connection
   */
  readonly refreshDelay = 600000;
  ws: WebSocket;

  constructor() {
    this.ws = this.createWebsocket();
  }

  async init(): Promise<void> {
    await this.bindSocketEvents();
  }

  /**
   * @returns A fresh `WebSocket` connection
   */
  createWebsocket(): WebSocket {
    return new WebSocket(`ws://${CONFIG.Api.BaseUrl}/ws/discord/`, { auth: `Bearer ${CONFIG.Api.PSK}` });
  }

  /**
   * Binds listeners to all websocket events
   */
  async bindSocketEvents(): Promise<void> {
    const dir = path.join(__dirname, "events");
    const files = readdirSync(dir);

    for (const f of files) {
      const fPath = path.join(dir, f);
      const evModule = await import(fPath);
      const ev: ApiEvent = evModule.default;
      // Attach logger to each event module
      ev.logger = this.logger.child({ moduleName: `ApiWorker:${ev.name}` });

      if (ev.once) {
        this.ws.once(ev.name.toString(), (...args) => ev.execute(this, ...args));
      } else {
        this.ws.on(ev.name.toString(), (...args) => ev.execute(this, ...args));
      }
    }
    this.logger.info(`Bound events to websocket`);
  }
}
