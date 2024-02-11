import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, userMention } from "discord.js";
import { appMissingPermsError, errorMessage } from "@discord/util/Replies";
import CONFIG from "@/config";
import Command from "@discord/interfaces/Command";

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
    )
    .addSubcommand(s => s.setName("sync").setDescription("Syncs users with organizer in the Discord to the database")),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Only hardcoded user ids will have access to this command
    if (!CONFIG.Organizer.Whitelist.includes(interaction.user.id)) {
      this.logger.warn(`User missing permission [Command: ${this.data.name} | User: ${interaction.user.tag}]`);
      await interaction.reply(errorMessage("You do not have permission to use this command!") && { ephemeral: true });
      return;
    }
    // Make sure we have permission to manage roles
    if (!interaction.appPermissions?.has(PermissionFlagsBits.ManageRoles, true)) {
      this.logger.error(`Client missing permissions [Command: ${this.data.name} | Permissions: ManageRoles]`);
      await interaction.reply(appMissingPermsError(["ManageRoles"]) && { ephemeral: true });
      return;
    }
    // Possible dropped interactions using `fetch`
    await interaction.deferReply({ ephemeral: true });
    const tUser = interaction.options.getUser("user");
    // Pull subcommand implementation and execute
    const subcommand = interaction.options.getSubcommand(true);
    const subModule = await import(`./${subcommand}`);
    const c: Partial<Command> = subModule.default;

    if (c.execute) {
      // Assign a child logger to the subcommand
      c.logger = this.logger.child({ moduleName: `${this.data.name}:${subcommand}` });
      // Make sure target user is actually a registrant for assign / unassign
      if (tUser) {
        let tMember;
        try {
          tMember = await interaction.guild!.members.fetch({ user: tUser, cache: true });
        } catch {
          // This should theoretically never happen, but fetch will throw an error if not wrapped
          this.logger.warn(`Could not find guildMember instance [Discord id: ${tUser.id}]`);
          await interaction.followUp(
            errorMessage(`Could not locate user ${userMention(tUser.id)} in the Guild cache!`),
          );
          return;
        }
        if (!tMember.roles.cache.has(CONFIG.Registrant.Role)) {
          this.logger.info(`Target user is not a registrant [Target: ${tUser.username}]`);
          await interaction.followUp(
            errorMessage(
              `Target user ${userMention(
                tUser.id,
              )} is not a registrant!\nIt's possible their roles have not yet been updated. Try again in a couple minutes.`,
            ),
          );
          return;
        }
        c.execute(interaction, tMember);
      } else {
        c.execute(interaction);
      }
    } else {
      this.logger.error(`No implementation found [Command: ${this.data.name} | Subcommand: ${subcommand}]`);
      await interaction.followUp(errorMessage("This command hasn't been implemented yet!"));
    }
  },
};
