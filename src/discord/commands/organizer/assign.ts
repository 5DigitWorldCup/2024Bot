import { ChatInputCommandInteraction, GuildMember, codeBlock, userMention } from "discord.js";
import Command from "discord/interfaces/Command";
import CONFIG from "config";
import { errorMessage, successMessage } from "@discord/util/Replies";
import ApiWorker from "@api/ApiWorker";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction, member: GuildMember): Promise<void> {
    // Avoid assigning organizer to user that already is one
    if (member.roles.cache.has(CONFIG.Organizer.Role)) {
      await interaction.reply(errorMessage(`Target user ${userMention(member.id)} is already an organizer!`));
      return;
    }
    // Set organizer server-side
    const apiOk = await ApiWorker.updateOrganizer(member.id, true);
    // Set organizer role discord-side
    if (!apiOk) {
      await interaction.reply(errorMessage("Failed to set the user as an organizer server-side!"));
      return;
    }
    // Grab organizer discord role
    const organizerRole = await interaction.guild!.roles.fetch(CONFIG.Organizer.Role, { cache: true });
    if (!organizerRole) {
      await interaction.reply(
        errorMessage(
          `Failed to find the ${codeBlock("organizer")} discord role!\nTarget user ${userMention(
            member.id,
          )} is likely flagged as an organizer in the database. Tell them to check on the website. If so: it is safe to grant them the discord role manually`,
        ),
      );
      return;
    }
    // Set the role
    await member.roles.add(organizerRole);
    await interaction.reply(
      successMessage(`Successfully granted organizer permissions to ${userMention(member.id)}`, true),
    );
  },
};
