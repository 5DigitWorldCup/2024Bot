import Command from "@discord/interfaces/Command";
import CONFIG from "@/config";
import { SlashCommandBuilder, ChatInputCommandInteraction, Status, bold, time, TimestampStyles } from "discord.js";
import { errorMessage, successEmbed } from "@discord/util/Replies";
import ExtendedClient from "@discord/ExtendedClient";

enum ApiStatus {
  Connecting = 0,
  Open = 1,
  Closed = 2,
  Closing = 3,
}

export default <Command>{
  data: new SlashCommandBuilder()
    .setName("heartbeat")
    .setDescription("Prints some statistics")
    .setDefaultMemberPermissions(0),
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    if (!CONFIG.Organizer.Whitelist.includes(interaction.user.id)) {
      this.logger.warn(`User missing permission [Command: ${this.data.name} | User: ${interaction.user.tag}]`);
      await interaction.reply(errorMessage("You do not have permission to use this command!"));
      return;
    }

    const stats = {
      "Bot Ready At": client.readyTimestamp ? time(Math.floor(client.readyTimestamp / 1000)) : "unknown",
      "Bot Uptime": client.uptime ? formatMsToHhMmSs(client.uptime) : "unknown",
      "Bot Latency": `${Date.now() - interaction.createdTimestamp} ms`,
      "Discord Ws Status": Status[client.ws.status],
      "Discord Ws Latency": `${client.ws.ping} ms`,
      "Api Ws Status": ApiStatus[client.apiWorker.ws.readyState],
      "Registrant Cache Size": client.apiWorker.registrantCache.size.toString(),
      "Registrant Next Batch Update": time(
        Math.floor(client.autoNameService.getNextRefresh() / 1000),
        TimestampStyles.RelativeTime,
      ),
    };

    let desc = "";
    for (const [key, val] of Object.entries(stats)) {
      desc += `${bold(key)}: ${val}\n`;
    }

    interaction.reply({
      embeds: [successEmbed(desc.trim()).setTitle("Heartbeat result")],
      ephemeral: true,
    });
  },
};

function formatMsToHhMmSs(ms: number): string {
  // Calculate the total number of seconds
  const totalSeconds = Math.floor(ms / 1000);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}
