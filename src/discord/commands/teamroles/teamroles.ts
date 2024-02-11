import Command from "@discord/interfaces/Command";
import CONFIG from "@/config";
import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { appMissingPermsError, errorMessage } from "@discord/util/Replies";
import ExtendedClient from "@discord/ExtendedClient";
import { parentLogger } from "@/common/Logger";

export default <Command>{
  data: new SlashCommandBuilder()
    .setName("teamroles")
    .setDescription("Enable or disable the assignment of team roles")
    .setDefaultMemberPermissions(0)
    .addSubcommand(s =>
      s.setName("check").setDescription("Check whether the feature is currently enabled or disabled."),
    )
    .addSubcommand(s =>
      s.setName("toggle").setDescription("Enable or disable the feature. Uses a confirmation prompt for safety."),
    )
    .addSubcommand(s =>
      s
        .setName("cleanup")
        .setDescription(
          "Deletes all but one instance of each team role from the server. Use this if the bot somehow makes multiple for any given teams.",
        ),
    )
    .addSubcommand(s => s.setName("revert").setDescription("Delete all team roles from the server.")),
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    if (!CONFIG.Organizer.Whitelist.includes(interaction.user.id)) {
      this.logger.warn(`User missing permission [Command: ${this.data.name} | User: ${interaction.user.tag}]`);
      await interaction.reply(errorMessage("You do not have permission to use this command!"));
      return;
    }
    if (!interaction.appPermissions?.has(PermissionFlagsBits.ManageRoles, true)) {
      this.logger.error(`Client missing permissions [Command: ${this.data.name} | Permissions: ManageRoles]`);
      await interaction.reply(appMissingPermsError(["ManageRoles"]) && { ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand(true);
    const subModule = await import(`./${subcommand}`);
    const c: Partial<Command> = subModule.default;

    if (!c.execute) {
      this.logger.error(`No implementation found [Command: ${this.data.name} | Subcommand: ${subcommand}]`);
      await interaction.followUp(errorMessage("This command hasn't been implemented yet!"));
      return;
    }
    c.logger = parentLogger.child({ moduleName: `teamroles:${subcommand}` });
    c.execute(interaction, client);
  },
};
