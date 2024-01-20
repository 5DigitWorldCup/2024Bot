import { Guild, GuildMember } from "discord.js";
import ExtendedClient from "@discord/ExtendedClient";
import CONFIG from "@/config";
import Logger from "@common/Logger";

const logger = Logger(module);

/**
 * Wrapper for obtaining the guild instance
 */
export async function getGuild(client: ExtendedClient): Promise<Guild | undefined> {
  let guild;
  try {
    guild = await client.guilds.fetch(CONFIG.Bot.GuildId);
  } catch (err) {
    logger.error("Failed to get Guild instance", err);
  }
  return guild;
}

/**
 * Wrapper for obtaining a guildMember instance
 */
export async function getMember(id: string, client: ExtendedClient): Promise<GuildMember | undefined> {
  const guild = await getGuild(client);
  if (!guild) return;
  let member;
  try {
    member = await guild.members.fetch({ user: id, cache: true });
  } catch (err) {
    logger.warn("Failed to get guildMember instance", err);
    return;
  }
  return member;
}
