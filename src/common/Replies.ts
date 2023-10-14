import { bold, EmbedBuilder, InteractionReplyOptions } from "discord.js";

/**
 * Creates an embed builder formatted for an error message
 * 
 * @param error The message to display to the user
 * @returns Embed builder formatted for error
 */
export function errorEmbed(error: string): EmbedBuilder {
  return new EmbedBuilder().setDescription(bold(error)).setColor("Red");
}

/**
 * Creates formatted `InteractionReplyOptions` containing an error embed
 * 
 * @param error The message to display in the embed
 * @returns Formatted options for easy replies
 */
export function errorMessage(error: string): InteractionReplyOptions {
  return { embeds: [errorEmbed(error)], ephemeral: true };
}