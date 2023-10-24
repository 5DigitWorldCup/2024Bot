import Command from "@interfaces/Command";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default <Command>{
  data: new SlashCommandBuilder().setName("helloworld").setDescription("we hawt"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({ content: "we out here", ephemeral: true });
    this.logger.info("hello?");
  },
};
