import { ChatInputCommandInteraction, FetchMemberOptions } from "discord.js";
import ExtendedClient from "@common/ExtendedClient";
import Command from "@interfaces/Command";

export default <Partial<Command>> {
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    // Fetch User and GuildMember of target
    const tUser = interaction.options.getUser("user", true);
    const tMember = await interaction.guild!.members.fetch({ user: tUser, cache: true})


    
  }
}