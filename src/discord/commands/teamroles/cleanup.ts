import { ChatInputCommandInteraction } from "discord.js";
import Command from "@discord/interfaces/Command";
import ExtendedClient from "@discord/ExtendedClient";
import { errorMessage, successMessage } from "@/discord/util/Replies";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient) {
    const success = await client.autoNameService.cleanupTeamRoles();
    await interaction.reply(
      success
        ? successMessage("Team roles should now be cleaned up!", true)
        : errorMessage("An error occurred while cleaning up team roles."),
    );
  },
};
