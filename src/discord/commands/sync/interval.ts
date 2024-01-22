import { ChatInputCommandInteraction, inlineCode } from "discord.js";
import Command from "@discord/interfaces/Command";
import ExtendedClient from "@discord/ExtendedClient";
import { successMessage } from "@/discord/util/Replies";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient) {
    const interval = interaction.options.getInteger("interval", true);
    client.autoNameService.setRefresh(interval);
    interaction.followUp(
      successMessage(`Users will now be synced every ${inlineCode(interval.toString())} seconds`, true),
    );
  },
};
