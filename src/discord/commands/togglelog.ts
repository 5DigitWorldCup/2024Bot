import Command from "@discord/interfaces/Command";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { errorMessage, successMessage } from "@discord/util/Replies";
import ExtendedClient from "@discord/ExtendedClient";
import CONFIG from "@/config";

export default <Command>{
  data: new SlashCommandBuilder()
    .setName("togglelog")
    .setDescription("Toggle the discord log forwarding")
    .setDefaultMemberPermissions(0),
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    if (!CONFIG.Organizer.Whitelist.includes(interaction.user.id)) {
      this.logger.warn(`User missing permission [Command: ${this.data.name} | User: ${interaction.user.tag}]`);
      await interaction.reply(errorMessage("You do not have permission to use this command!"));
      return;
    }
    const logging = !client.loggingEnabled;
    client.loggingEnabled = logging;
    const text = logging ? "Discord logging has been enabled!" : "Discord logging has been disabled!";
    await interaction.reply(successMessage(text, true));
  },
};
