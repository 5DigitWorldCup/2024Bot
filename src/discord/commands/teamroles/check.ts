import { ChatInputCommandInteraction, bold } from "discord.js";
import Command from "@discord/interfaces/Command";
import ExtendedClient from "@discord/ExtendedClient";
import { successMessage } from "@/discord/util/Replies";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient) {
    const text = client.autoNameService.getTeamRolesEnabled() ? bold("enabled") : bold("disabled");
    await interaction.reply(successMessage(`The creation and assignment of team roles is currently ${text}!`, true));
  },
};
