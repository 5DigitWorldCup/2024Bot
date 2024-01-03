import Command from "@discord/interfaces/Command";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import ExtendedClient from "@discord/ExtendedClient";

export default <Command>{
  data: new SlashCommandBuilder().setName("test").setDescription("test command").setDefaultMemberPermissions(0),
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    interaction.reply("nuts");
    this.logger.info(JSON.stringify(client.apiWorker.registrantCache));
  },
};
