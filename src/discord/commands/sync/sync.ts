import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { errorMessage } from "@discord/util/Replies";
import ExtendedClient from "@discord/ExtendedClient";
import CONFIG from "@/config";
import Command from "@discord/interfaces/Command";

export default <Command>{
  data: new SlashCommandBuilder()
    .setName("sync")
    .setDescription("Admin commands pertaining to syncing registrant roles and nicknames")
    .setDefaultMemberPermissions(0)
    .addSubcommand(s => s.setName("force").setDescription("Forces an all-users sync for roles and nicknames"))
    .addSubcommand(s =>
      s
        .setName("interval")
        .setDescription("Sets the interval for automatic sync")
        .addIntegerOption(o => o.setName("interval").setDescription("Amount of time in seconds").setRequired(true)),
    )
    .addSubcommand(s => s.setName("sync").setDescription("Syncs users with organizer in the Discord to the database")),
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    // Only hardcoded user ids will have access to this command
    if (!CONFIG.Organizer.Whitelist.includes(interaction.user.id)) {
      this.logger.warn(`User missing permission [Command: ${this.data.name} | User: ${interaction.user.tag}]`);
      await interaction.reply(errorMessage("You do not have permission to use this command!"));
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    // Pull subcommand implementation and execute
    const subcommand = interaction.options.getSubcommand(true);
    const subModule = await import(`./${subcommand}`);
    const c: Partial<Command> = subModule.default;

    if (!c.execute) {
      this.logger.error(`No implementation found [Command: ${this.data.name} | Subcommand: ${subcommand}]`);
      await interaction.followUp(errorMessage("This command hasn't been implemented yet!"));
      return;
    }
    c.execute(interaction, client);
  },
};
