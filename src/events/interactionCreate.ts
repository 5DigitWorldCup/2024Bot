import { BaseInteraction, CommandInteraction, Events } from "discord.js";
import { errorMessage } from "@common/Replies";
import Event from "@interfaces/Event";
import ExtendedClient from "@common/ExtendedClient";

export default <Event> {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction: BaseInteraction): Promise<void> {
    // Ignore interactions that are:
    // Created by bots | Not in a guild | Not our command format
    if (interaction.user.bot || !interaction.inGuild()) return;
    if (!interaction.isCommand() && !interaction.isContextMenuCommand()) return;

    const client = interaction.client as ExtendedClient;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      this.logger.warn(`A command could not be found to execute ${formatLogArgs(interaction)}`);
      return;
    }

    try {
      await command.execute(interaction, client);
      this.logger.info(`Successfully executed application command ${formatLogArgs(interaction)}`);
    } catch (err) {
      this.logger.error(`Error executing application command ${formatLogArgs(interaction)}`, err);
      const func = interaction.deferred || interaction.replied ? interaction.followUp : interaction.reply;
      func.call(interaction, errorMessage("An error occured processing this command!"));
    }
  }
}

function formatLogArgs(interaction: CommandInteraction): string {
  const { commandName, user: { tag } } = interaction
  if (interaction.channel && interaction.inGuild()) {
    return `[Name: ${commandName} | Caller: ${tag} | Channel: ${interaction.channel.name}]`;
  } else {
    return `[Name: ${commandName} | Caller: ${tag} | Channel: undefined]`;
  }
}