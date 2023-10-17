import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { appMissingPermsError, errorMessage } from "@common/Replies";
import { OrganizerAccessIds } from "@common/Constants";
import Command from "@interfaces/Command";
import ExtendedClient from "@common/ExtendedClient";

/*
  Flow ->

  [ X ] Check command caller for required staff role
    - Alternatively make the command disabled for @everyone and have an admin manually
      create role exceptions for staff that would be using the command. That or
      have a hardcoded configured role id that will be allowed. I think the former is easier

  [  ] Verify target user is registered
    - Via registered role, api, or both? Probably api for certainty

  [  ] Check if anyone of same country flag is organizer?
    - This would require osu!api integration and depends on whether we
      want to hard restrict each country to one organizer or not

  [  ] "Are you sure?" (Yes / No / Cancel) confirmation via modal?
    - Just to be safe + easy to implement

  [  ] Assign "organizer" role
    - This role id should either be hardcoded via config or stored somewhere in the api
      - Api could always hold a config file or json object for the bot?

  [  ] Set "organizer flag via api call"
*/

export default <Command> {
  data: new SlashCommandBuilder()
    .setName("organizer")
    .setDescription("Set a user as a country organizer")
    .setDefaultMemberPermissions(0)
    .addSubcommand(s => s
        .setName("assign")
        .setDescription("Assign the target user to be a country organizer")
        .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
      )
    .addSubcommand(s => s
        .setName("unassign")
        .setDescription("Unassign the target user from being a country organizer")
        .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
      ),
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    // Make sure we have permission to manage roles
    if (!interaction.appPermissions?.has(PermissionFlagsBits.ManageRoles)) {
      this.logger.error(`App missing permissions [Command: ${this.data.name} | Permissions: ManageRoles]`);
      await interaction.reply(appMissingPermsError(["ManageRoles"]));
      return;
    }
    // Only hardcoded user ids will have access to this command
    if (!OrganizerAccessIds.includes(interaction.user.id)) {
      this.logger.warn(`User missing permission [Command: ${this.data.name} | User: ${interaction.user.tag}]`);
      await interaction.reply(errorMessage("You do not have permission to use this command!"));
      return;
    }

    // Pull subcommand implementation and execute
    const subcommand = interaction.options.getSubcommand(true);
    const subModule = await import(`./${subcommand}`);
    const c: Partial<Command> = subModule.default;

    if (c.execute) {
      // Assign a child logger to the subcommand
      c.logger = this.logger.child({ moduleName: `${this.data.name}:${subcommand}` });
      c.execute(interaction, client);
    } else {
      this.logger.error(`No implementation found [Command: ${this.data.name} | Subcommand: ${subcommand}]`);
      await interaction.reply(errorMessage("This command hasn't been implemented yet!"));
      return;
    }
  }
}