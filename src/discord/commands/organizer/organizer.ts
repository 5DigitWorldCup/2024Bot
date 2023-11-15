import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, userMention } from "discord.js";
import { appMissingPermsError, errorMessage } from "discord/util/Replies";
import CONFIG from "config";
import Command from "discord/interfaces/Command";

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

export default <Command>{
  data: new SlashCommandBuilder()
    .setName("organizer")
    .setDescription("Assign or unassign a registrant as a country organizer")
    .setDefaultMemberPermissions(0)
    .addSubcommand(s =>
      s
        .setName("assign")
        .setDescription("Assign a registrant to be a country organizer")
        .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true)),
    )
    .addSubcommand(s =>
      s
        .setName("unassign")
        .setDescription("Unassign a registrant from being a country organizer")
        .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true)),
    ),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Make sure we have permission to manage roles
    if (!interaction.appPermissions?.has(PermissionFlagsBits.ManageRoles, true)) {
      this.logger.error(`Client missing permissions [Command: ${this.data.name} | Permissions: ManageRoles]`);
      await interaction.reply(appMissingPermsError(["ManageRoles"]));
      return;
    }
    // Only hardcoded user ids will have access to this command
    if (!CONFIG.Organizer.Whitelist.includes(interaction.user.id)) {
      this.logger.warn(`User missing permission [Command: ${this.data.name} | User: ${interaction.user.tag}]`);
      await interaction.reply(errorMessage("You do not have permission to use this command!"));
      return;
    }
    // Make sure target user is actually a registrant
    // NOTE We could also check the api but the roles shouldnt be unsynced for long periods of time anyways
    const tUser = interaction.options.getUser("user", true);
    const tMember = await interaction.guild!.members.fetch({ user: tUser, cache: true });
    if (!tMember.roles.cache.has(CONFIG.Registrant.Role)) {
      this.logger.info(`Target user is not a registrant [Target: ${tUser.username}]`);
      await interaction.reply(
        errorMessage(
          `Target user ${userMention(
            tUser.id,
          )} is not a registrant!\nIt's possible their roles have not yet been updated. Try again in a couple minutes.`,
        ),
      );
      return;
    }

    // Pull subcommand implementation and execute
    const subcommand = interaction.options.getSubcommand(true);
    const subModule = await import(`./${subcommand}`);
    const c: Partial<Command> = subModule.default;

    if (c.execute) {
      // Assign a child logger to the subcommand
      c.logger = this.logger.child({ moduleName: `${this.data.name}:${subcommand}` });
      c.execute(interaction, tMember);
    } else {
      this.logger.error(`No implementation found [Command: ${this.data.name} | Subcommand: ${subcommand}]`);
      await interaction.reply(errorMessage("This command hasn't been implemented yet!"));
    }
  },
};
