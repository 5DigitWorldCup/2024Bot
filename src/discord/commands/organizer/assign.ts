import { ChatInputCommandInteraction } from "discord.js";
import Command from "discord/interfaces/Command";
import { errorMessage } from "discord/util/Replies";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Fetch User and GuildMember of target
    // await interaction.deferReply({ ephemeral: true });
    // const tUser = interaction.options.getUser("user", true);
    // const tMember = await interaction.guild!.members.fetch({ user: tUser, cache: true });
    await interaction.reply(errorMessage("This command has yet to be implemented!"));
  },
};
