import { Collection, Guild, GuildMember, Role } from "discord.js";
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
    // Try cache first, then fetch from discord
    member = guild.members.cache.get(id);
    if (!member) {
      member = await guild.members.fetch({ user: id, cache: true });
    }
  } catch {
    return;
  }
  return member;
}

/**
 * Fetch all roles from the guild
 */
export async function getAllRoles(client: ExtendedClient): Promise<Collection<string, Role> | undefined> {
  const guild = await getGuild(client);
  if (!guild) return;
  let roles;
  try {
    roles = await guild.roles.fetch(undefined, { cache: true });
  } catch {
    return;
  }
  return roles;
}

/**
 * Checks if a member is a staff member
 */
export function isStaff(member: GuildMember): boolean {
  return member.roles.cache.has(CONFIG.Staff.Role);
}
