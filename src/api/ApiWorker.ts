import Logger from "@common/Logger";
import path from "path";
import { readdirSync } from "fs";
import CONFIG from "config";
import { WebSocket } from "ws";
import ApiEvent from "@api/interfaces/ApiEvent";
import { RegistrantSchema } from "@api/schema/RegistrantSchema";
import type { Registrant } from "@api/types/Registrant";
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
  static async getAllRegistrants(): Promise<Registrant[] | undefined> {
    const res = await this.sendRequest("GET", "/registrants/");
    if (res instanceof Array) {
      const valid = res.every(e => RegistrantSchema.safeParse(e).success === true);
      if (valid) return res as Registrant[];
    } else {
      Logger(module).error(`Received invalid data from api`);
    }
  }

  /**
   * Update a registrant's organizer status
   * @param discordId Discord Id of the target user
   * @param isOrgaizer If the user will be an organizer or not
   */
  static async updateOrganizer(discordId: string, isOrgaizer: boolean): Promise<boolean> {
    // eslint-disable-next-line camelcase
    const res = await this.sendRequest("PATCH", `/registrants/${discordId}/`, { is_organizer: isOrgaizer });
    const parsed = RegistrantSchema.safeParse(res);
    if (parsed.success) {
      return parsed.data.is_organizer === isOrgaizer;
    } else {
      Logger(module).error(`Received invalid data from api`, parsed.error);
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
  private static async sendRequest(
    method: "GET" | "POST" | "PATCH",
    endpoint: string,
    data: object = {},
  ): Promise<any> {
    const reqHeaders = new Headers();
    reqHeaders.append("Content-Type", "application/json");
    reqHeaders.append("Authorization", `Token ${CONFIG.Api.PSK}`);

    const reqInfo: Partial<RequestInit> = {
      method: method,
      headers: reqHeaders,
    };
    if (Object.keys(data).length !== 0) reqInfo.body = JSON.stringify(data);

    let res;
    try {
      res = await fetch(`http://${CONFIG.Api.BaseUrl}${endpoint}`, reqInfo);
    } catch (err) {
      Logger(module).error(`Error executing Fetch operation`, err);
      return;
    }
    if (!res.ok) {
      Logger(module).error(`Bad API response [Method: ${method} | Endpoint: ${endpoint} | Status: ${res.status}]`);
      return;
    }
    return await res.json();
  }
}
