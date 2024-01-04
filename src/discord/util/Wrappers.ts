import { Guild } from "discord.js";
import ExtendedClient from "@discord/ExtendedClient";
import CONFIG from "config";
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
    logger.error("Could not find Guild instance", err);
  }
  return guild;
}
