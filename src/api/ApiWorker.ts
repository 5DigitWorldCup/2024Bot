import Logger from "@common/Logger";
import path from "path";
import { readdirSync } from "fs";
import CONFIG from "config";
import { WebSocket } from "ws";
import ApiEvent from "@api/interfaces/ApiEvent";
import TournamentPlayer from "@api/interfaces/TournamentPlayer";
import ExtendedClient from "@discord/ExtendedClient";

export default class ApiWorker {
  readonly client: ExtendedClient;
  readonly logger = Logger(module);
  /**
   * Exponential scalar for reconnection timeout
   */
  nReconAttempts = 0;
  ws: WebSocket;

  constructor(client: ExtendedClient) {
    this.client = client;
    this.ws = this.createWebsocket();
  }

  async init(): Promise<void> {
    await this.bindSocketEvents();
  }

  /**
   * Creates a fresh `WebSocket` connection
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

  /**
   * Queries the Api for all registrants for batch updates
   * @returns An array of TournamentPlayer
   */
  static async getAllRegistrants(): Promise<TournamentPlayer[]> {
    return (await this.sendRequest("GET", "/registrants/")) as TournamentPlayer[];
  }

  /**
   * Update a registrant's organizer status
   * @param discordId Discord Id of the target user
   * @param isOrgaizer If the user will be an organizer or not
   */
  static async updateOrganizer(discordId: string, isOrgaizer: boolean): Promise<boolean> {
    try {
      const res = (await this.sendRequest("PATCH", `/registrants/${discordId}/`, {
        // eslint-disable-next-line camelcase
        is_organizer: isOrgaizer,
      })) as TournamentPlayer;
      return res.is_organizer == isOrgaizer ? true : false;
    } catch (err) {
      Logger(module).error(err);
      return false;
    }
  }

  /**
   * Send a request to the 2024API
   * @param method HTTP Method to use
   * @param endpoint API endpoint to target
   * @param data What data to send as body
   * @returns Parsed json from response body
   */
  static async sendRequest(method: string, endpoint: string, data: object = {}): Promise<any> {
    const reqHeaders = new Headers();
    reqHeaders.append("Content-Type", "application/json");
    reqHeaders.append("Authorization", `Token ${CONFIG.Api.PSK}`);

    const reqInfo: Partial<RequestInit> = {
      method: method,
      headers: reqHeaders,
    };
    if (Object.keys(data).length !== 0) reqInfo.body = JSON.stringify(data);

    const res = await fetch(`http://${CONFIG.Api.BaseUrl}${endpoint}`, reqInfo);
    if (!res.ok) {
      Logger(module).error(
        `Bad API response [Method: ${method} | Endpoint: ${endpoint} | Data: ${JSON.stringify(data)}]`,
      );
      throw Error(`Bad API response [Status: ${res.status} | Response: ${JSON.stringify(await res.json())}]`);
    } else {
      return await res.json();
    }
  }
}
