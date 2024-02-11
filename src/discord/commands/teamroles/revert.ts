import { ChatInputCommandInteraction } from "discord.js";
import Command from "@discord/interfaces/Command";
import ExtendedClient from "@discord/ExtendedClient";
import { errorMessage, successMessage } from "@/discord/util/Replies";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient) {
    const success = await client.autoNameService.deleteAllTeamRoles();
    await interaction.reply(
      success
        ? successMessage("All team roles have been successfully deleted!", true)
        : errorMessage("An error occurred while deleting all team roles."),
    );
  },
};
