import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  bold,
  time,
  TimestampStyles,
  ActionRowBuilder,
  MessageComponentInteraction,
} from "discord.js";
import Command from "@discord/interfaces/Command";
import ExtendedClient from "@discord/ExtendedClient";
import { successEmbed } from "@/discord/util/Replies";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient) {
    const currentlyEnabled = client.autoNameService.getTeamRolesEnabled();
    const disabledText = bold("disabled");
    const enabledText = bold("enabled");
    // Extra warning text for enabling feature
    const enabledExtraText = `\n\nBe aware that enabling this feature will cause changes to take effect on the next batch reset. Team roles for all teams with created rosters will be created and assigned to members. This will occur ${time(
      Math.floor(client.autoNameService.getNextRefresh() / 1000),
      TimestampStyles.RelativeTime,
    )}`;

    // Button components
    const confirmButton = new ButtonBuilder().setCustomId("confirm").setLabel("Confirm").setStyle(ButtonStyle.Success);
    const cancelButton = new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger);
    const buttonRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    const initialEmbed = new EmbedBuilder()
      .setColor("Orange")
      .setDescription(
        `The creation and assignment of team roles is currently ${currentlyEnabled ? enabledText : disabledText}!${
          currentlyEnabled ? "" : enabledExtraText
        }\n\nAre you sure you want to ${!currentlyEnabled ? enabledText : disabledText} this feature?`,
      );

    // Send initial message with warning and confirmation buttons
    const response = await interaction.reply({
      embeds: [initialEmbed],
      // Some sort of typing error within DJS that disallows adding components as described in the docs
      // https://discordjs.guide/message-components/buttons.html#building-buttons
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line
      components: [buttonRow],
      ephemeral: true,
    });
    // Filter button interactions by the original interaction author
    const collectorFilter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;

    try {
      // Await response from buttons
      const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

      // Handle confirm / cancel
      if (confirmation.customId === "confirm") {
        client.autoNameService.setTeamRolesEnabled(!currentlyEnabled);
        await confirmation.update({
          embeds: [
            successEmbed(
              `The creation and assignment of team roles has been successfully ${
                !currentlyEnabled ? enabledText : disabledText
              }.`,
            ),
          ],
          components: [],
        });
        this.logger?.info(`Team role creation has been ${!currentlyEnabled ? "enabled" : "disabled"}`);
        return;
      } else if (confirmation.customId === "cancel") {
        await confirmation.update({
          embeds: [
            successEmbed(
              `Action successfully cancelled. The creation and assignment of team roles will remain ${
                currentlyEnabled ? enabledText : disabledText
              }.`,
            ),
          ],
          components: [],
        });
        this.logger?.info("Caller chose to cancel, no action taken");
      }
    } catch {
      await interaction.editReply({
        embeds: [
          successEmbed(
            `Confirmation not received within 1 minute, cancelling. The creation and assignment of team roles will remain ${
              currentlyEnabled ? enabledText : disabledText
            }.`,
          ),
        ],
        components: [],
      });
      this.logger?.info("Confirmation timed out, no action taken");
    }
  },
};
