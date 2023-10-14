import ExtendedClient from "@common/ExtendedClient";
import { BaseInteraction, Events } from "discord.js";
import Event from "@interfaces/Event";

export default <Event> {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction: BaseInteraction): Promise<void> {
    if (interaction.user.bot) return;
    if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

    const client = interaction.client as ExtendedClient
    const command = client.commands.get(interaction.commandName)

    if (!command) {
      return
    }

    try {
      command.execute(interaction, client);
      this.logger!.info(
        `Successfully executed application command [Name: ${command.data.name}]`
      )
    } catch (e) {
      this.logger!.error("an error?", e);
    }
  }
}