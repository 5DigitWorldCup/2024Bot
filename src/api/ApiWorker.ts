import Logger from "@common/Logger";
import path from "path";
import { readdirSync } from "fs";
import CONFIG from "@/config";
import { WebSocket } from "ws";
import ApiEvent from "@api/interfaces/ApiEvent";
import { RegistrantSchema } from "@api/schema/RegistrantSchema";
import type { Registrant } from "@api/types/Registrant";
import type { RawRegistrant } from "@api/types/RawRegistrant";
import type ExtendedClient from "@discord/ExtendedClient";
import { Collection } from "discord.js";
import { RegistrantPageSchema } from "@api/schema/RegistrantPageSchema";
import RegistrantPager from "@api/RegistrantPager";
import { RawRegistrantSchema } from "@api/schema/RawRegistrantSchema";
import { EventEmitter } from "events";

export type KeyParam = "osu" | "discord" | "id";

export default class ApiWorker {
  public readonly client: ExtendedClient;
  private readonly logger = Logger(module);
  /**
   * Exponential scalar for reconnection timeout
   */
  public nReconAttempts = 0;
  /**
   * Websocket connection to the api that recieves registrant related data
   */
  public ws: WebSocket;
  /**
   * Implementations for the various actions taken with registrant data recieved from the websocket
   */
  public wsMessageHandler: EventEmitter;
  /**
   * Cache containing basic registrant data (discord id, osu username, is organizer)
   */
  public registrantCache: Collection<string, Registrant> = new Collection();

  constructor(client: ExtendedClient) {
    this.client = client;
    this.ws = this.createWebsocket();
    this.wsMessageHandler = new EventEmitter();
  }

  public async init(): Promise<void> {
    await this.bindEvents(this.wsMessageHandler, "ws/messageevents");
    this.logger.info("Bound events to websocket message");
    await this.bindEvents(this.ws, "ws/events");
    this.logger.info("Bound events to websocket");
  }

  /**
   * Creates a fresh `WebSocket` connection
   */
  public createWebsocket(): WebSocket {
    return new WebSocket(`wss://${CONFIG.Api.BaseUrl}/ws/discord/`, { auth: `Token ${CONFIG.Api.PSK}` });
  }

  /**
   * Binds listeners to all websocket events
   */
  public async bindEvents(listener: EventEmitter, subdir: string): Promise<void> {
    const dir = path.join(__dirname, subdir);
    const files = readdirSync(dir);

    for (const f of files) {
      const fPath = path.join(dir, f);
      const evModule = await import(fPath);
      const ev: ApiEvent = evModule.default;
      // Attach logger to each event module
      ev.logger = this.logger.child({ moduleName: `ApiWorker:${ev.name}` });

      if (ev.once) {
        listener.once(ev.name, (...args) => ev.execute(this, ...args));
      } else {
        listener.on(ev.name, (...args) => ev.execute(this, ...args));
      }
    }
  }

  /**
   * Rebuild the cache directly from the api
   */
  public async populateCache(): Promise<void> {
    this.logger.info("Populating registrant cache");
    const pager = await ApiWorker.getAllRegistrants();
    if (!pager) {
      this.logger.warn("Failed to obtain pager, aborting cache population");
      return;
    }
    const newCache = new Collection<string, Registrant>();
    // For all of 2 minutes that we have less than 100 regs or whatever the default page size is
    const data = pager.getRegistrants();
    data.forEach(reg => newCache.set(reg.discord_user_id, reg));
    // Scroll pages
    while (pager.morePages) {
      const ok = await pager.getNextPage();
      if (!ok) {
        this.logger.warn("Could not advance pages, aborting cache population");
        return;
      }
      const data = pager.getRegistrants();
      data.forEach(reg => newCache.set(reg.discord_user_id, reg));
    }
    this.registrantCache = newCache;
  }

  /**
   * Queries the Api for a single registrant
   */
  public async getOneRegistrant(
    search: string,
    key: KeyParam,
    full: boolean = false,
  ): Promise<RawRegistrant | Registrant | undefined> {
    // Try to pull from cache first
    if (!full && key === "discord") {
      const data = this.registrantCache.get(search);
      if (data) return data;
    }
    const endpoint = key !== "id" ? `/registrants/${search}/?key=${key}` : `/registrants/${search}/`;
    // Request from api
    const res = await ApiWorker.sendRequest("GET", endpoint);
    if (!res) return;
    const parsed = full ? RawRegistrantSchema.safeParse(res) : RegistrantSchema.safeParse(res);
    if (!parsed.success) return;
    return parsed.data;
  }

  /**
   * Queries the Api for all registrants for batch updates
   * @returns An instance of a wrapper class for pagination
   */
  public static async getAllRegistrants(): Promise<RegistrantPager | undefined> {
    const res = await this.sendRequest("GET", "/registrants/");
    const parsed = RegistrantPageSchema.safeParse(res);
    if (parsed.success) {
      return new RegistrantPager(parsed.data);
    } else {
      Logger(module).error(`Received invalid data from api`);
    }
  }

  /**
   * Update a registrant's organizer status
   * @param discordId Discord Id of the target user
   * @param isOrganizer If the user will be an organizer or not
   */
  public static async updateOrganizer(discordId: string, isOrganizer: boolean): Promise<boolean> {
    const res = await this.sendRequest("PATCH", `/registrants/${discordId}/?key=discord`, {
      // eslint-disable-next-line camelcase
      is_organizer: isOrganizer,
    });
    const parsed = RegistrantSchema.safeParse(res);
    if (parsed.success) {
      return parsed.data.is_organizer === isOrganizer;
    } else {
      Logger(module).error(`Received invalid data from api`, parsed.error);
      return false;
    }
  }

  public static async updateStaff(discordId: string, isStaff: boolean): Promise<boolean> {
    const res = await this.sendRequest("PATCH", `/registrants/${discordId}/?key=discord`, {
      // eslint-disable-next-line camelcase
      is_staff: isStaff,
    });
    if (Object.hasOwn(res, "msg")) {
      const match = isStaff ? "True" : "False";
      return res.msg.includes(match);
    }
    return false;
  }

  /**
   * Send a request to the 2024API
   * @param method HTTP Method to use
   * @param endpoint API endpoint to target
   * @param data What data to send as body
   * @returns Parsed json from response body
   */
  public static async sendRequest(method: "GET" | "POST" | "PATCH", endpoint: string, data: object = {}): Promise<any> {
    const reqHeaders = new Headers();
    reqHeaders.append("Content-Type", "application/json");
    reqHeaders.append("Authorization", `Token ${CONFIG.Api.PSK}`);

    const reqInfo: Partial<RequestInit> = {
      method: method,
      headers: reqHeaders,
    };
    if (Object.keys(data).length !== 0) reqInfo.body = JSON.stringify(data);
    return await this.safeFetch(`https://${CONFIG.Api.BaseUrl}${endpoint}`, reqInfo);
  }

  /**
   * Uses `fetch()` and catches errors
   */
  public static async safeFetch(input: RequestInfo, init?: RequestInit | undefined): Promise<any> {
    let res;
    try {
      res = await fetch(input, init);
    } catch (err) {
      Logger(module).error(`Error executing Fetch operation`, err);
      return;
    }
    if (!res.ok) {
      Logger(module).error(`Bad API response [Path: ${input} | Method: ${init?.method} | Status: ${res.status}]`);
      return;
    }
    return await res.json();
  }
}
