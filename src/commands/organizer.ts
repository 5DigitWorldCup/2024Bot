import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { appMissingPermsError, errorMessage } from "@common/Replies";
import Command from "@interfaces/Command";
import ExtendedClient from "@common/ExtendedClient";

export default <Command> {
  data: new SlashCommandBuilder()
    .setName("organizer")
    .setDescription("Set a user as a country organizer")
    .setDefaultMemberPermissions(0)
    .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    // Make sure we have permission to manage roles
    if (!interaction.appPermissions?.has(PermissionFlagsBits.ManageRoles)) {
      this.logger.error(`App missing permissions [Command: ${this.data.name} | Permissions: ManageRoles]`)
      await interaction.reply(appMissingPermsError(["ManageRoles"]));
      return;
    }

    await interaction.reply(errorMessage("This command hasn't been implemented yet!"));
    return;

    const target = interaction.options.getUser("user", true);
    const caller = interaction.member;

    /*
    Flow ->

    Check command caller for required staff role
      - Alternatively make the command disabled for @everyone and have an admin manually
        create role exceptions for staff that would be using the command. That or
        have a hardcoded configured role id that will be allowed. I think the former is easier

    Verify target user is registered
      - Via registered role, api, or both? Probably api for certainty

    Check if anyone of same country flag is organizer?
      - This would require osu!api integration and depends on whether we
        want to hard restrict each country to one organizer or not

    "Are you sure?" (Yes / No / Cancel) confirmation via modal?
      - Just to be safe + easy to implement

    Assign "organizer" role
      - This role id should either be hardcoded via config or stored somewhere in the api
        - Api could always hold a config file or json object for the bot?

    Set "organizer flag via api call"
    */
  }
}