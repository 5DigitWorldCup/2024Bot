import { Events } from "discord.js";
import Logger from "@common/Logger";
import ExtendedClient from "@common/ExtendedClient";
import Event from "@interfaces/Event";

const log = Logger(module);

export default <Event> {
  name: Events.ClientReady,
  once: true,
  execute(client: ExtendedClient) {
    log.info(`Logged in as ${client.user?.tag}`)
    client.application?.fetch()
  },
}