import { Events } from "discord.js";
import ExtendedClient from "discord/ExtendedClient";
import DiscordEvent from "discord/interfaces/DiscordEvent";

export default <DiscordEvent>{
  name: Events.ClientReady,
  once: true,
  execute(client: ExtendedClient) {
    this.logger.info(`Logged in as ${client.user?.tag}`);
    client.application?.fetch();
  },
};
