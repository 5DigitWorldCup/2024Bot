import { ChatInputCommandInteraction, GuildMember, userMention, codeBlock } from "discord.js";
import CONFIG from "config";
import Command from "discord/interfaces/Command";
import { errorMessage, successMessage } from "discord/util/Replies";
import ApiWorker from "@api/ApiWorker";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction, member: GuildMember): Promise<void> {
    // Avoid removing organizer from users that arent one already
    if (!member.roles.cache.has(CONFIG.Organizer.Role)) {
      await interaction.followUp(errorMessage(`Target user ${userMention(member.id)} is not an organizer!`));
      return;
    }
    // Set organizer server-side
    const apiOk = await ApiWorker.updateOrganizer(member.id, false);
    // Set organizer role discord-side
    if (!apiOk) {
      await interaction.followUp(errorMessage("Failed to remove organizer from user server-side!"));
      return;
    }
    // Fetch organizer discord role
    const organizerRole = await interaction.guild!.roles.fetch(CONFIG.Organizer.Role, { cache: true });
    if (!organizerRole) {
      await interaction.followUp(
        errorMessage(
          `Failed to find the ${codeBlock("organizer")} discord role!\nTarget user ${userMention(
            member.id,
          )} is likely flagged as a non-organizer in the database. Tell them to check on the website. If so: it is safe to remove the discord role manually`,
        ),
      );
      return;
    }
    // Set the role
    await member.roles.remove(organizerRole);
    await interaction.followUp(
      successMessage(`Successfully removed organizer permissions from ${userMention(member.id)}`, true),
    );
  },
};
