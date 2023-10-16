import { Events } from "discord.js";
import ExtendedClient from "@common/ExtendedClient";
import Event from "@interfaces/Event";

export default <Event> {
  name: Events.ClientReady,
  once: true,
  execute(client: ExtendedClient) {
    this.logger.info(`Logged in as ${client.user?.tag}`)
    client.application?.fetch()
  },
}