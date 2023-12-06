import Command from "discord/interfaces/Command";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import ApiWorker from "@api/ApiWorker";

export default <Command>{
  data: new SlashCommandBuilder().setName("helloworld").setDescription("we hawt"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({ content: "we out here", ephemeral: true });
    await ApiWorker.getAllRegistrants();
  },
};
