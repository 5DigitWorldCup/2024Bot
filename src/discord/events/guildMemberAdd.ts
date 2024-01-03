import { Events, GuildMember } from "discord.js";
import DiscordEvent from "@discord/interfaces/DiscordEvent";
import type ExtendedClient from "@discord/ExtendedClient";

export default <DiscordEvent>{
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member: GuildMember) {
    const client = member.client as ExtendedClient;

    const registrantData = client.apiWorker.registrantCache.get(member.id);
    if (registrantData) {
      client.autoNameService.syncOneUser(registrantData);
    }
  },
};
