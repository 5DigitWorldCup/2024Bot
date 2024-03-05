import { ChatInputCommandInteraction, Message } from "discord.js";
import Command from "@discord/interfaces/Command";
import ExtendedClient from "@discord/ExtendedClient";
import { successEmbed } from "@/discord/util/Replies";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient, message: Message) {
    await client.apiWorker.populateCache();
    await client.autoNameService.syncAllUsers();
    if (message.editable) message.edit({ embeds: [successEmbed("All users have been synced")] });
  },
};
