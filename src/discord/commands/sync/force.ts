import { ChatInputCommandInteraction } from "discord.js";
import Command from "@discord/interfaces/Command";
import ExtendedClient from "@discord/ExtendedClient";
import { successMessage } from "@/discord/util/Replies";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient) {
    await client.apiWorker.populateCache();
    await client.autoNameService.syncAllUsers();
    interaction.followUp(successMessage("All users have been synced") && { ephemeral: true });
  },
};
