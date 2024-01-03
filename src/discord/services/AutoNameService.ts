import type { Registrant } from "@api/types/Registrant";
import Logger from "@common/Logger";
import ExtendedClient from "@discord/ExtendedClient";
import CONFIG from "config";
import { userMention } from "discord.js";

export default class AutoNameService {
  private readonly logger = Logger(module);
  public readonly client: ExtendedClient;
  /**
   * Delay for rebuilding the registrant cache and syncing user in seconds
   *
   * Default -- 900 seconds (15 minutes)
   */
  private readonly refreshDelay = 900;
  constructor(client: ExtendedClient) {
    this.client = client;
    // Set reocurring tasks
    setInterval(async () => {
      await this.client.apiWorker.populateCache();
      this.syncAllUsers();
    }, this.refreshDelay * 1000);
  }

  /**
   * Announce a new registrant to the discord
   * @param id Discord user id
   */
  public async announceRegistrant(id: string): Promise<void> {
    const channel = await this.client.channels.fetch(CONFIG.Registrant.Channel, { cache: true });
    if (!channel) {
      this.logger.error("Could not find registrant announce Channel instance");
      return;
    }
    if (channel.isTextBased()) await channel.send(`${userMention(id)} has registered!`);
  }

  /**
   * Set the target registrant's discord profile to use the registrant role and their osu! username
   * @param registrant The raw data object representing a player
   */
  public async syncOneUser(registrant: Registrant): Promise<boolean> {
    // Fetch our guild instance
    let guild;
    try {
      guild = await this.client.guilds.fetch(CONFIG.Bot.GuildId);
    } catch {
      this.logger.error("Could not find Guild instance");
      return false;
    }
    // Fetch the target guildMember
    let member;
    try {
      member = await guild.members.fetch({ user: registrant.discord_user_id, cache: true });
    } catch {
      this.logger.warn(`Could not find guildMember instance [Discord id: ${registrant.discord_user_id}]`);
      return false;
    }
    // Big try/catch here to avoid any crashes with missing perms
    try {
      // Update discord member values
      // Set osu nickname
      if (member.displayName !== registrant.osu_username) {
        member.setNickname(registrant.osu_username, "Auto Name Service");
      }
      // Set registrant role
      if (!member.roles.cache.has(CONFIG.Registrant.Role)) {
        // Fetch registrant role
        const registrantRole = await guild.roles.fetch(CONFIG.Registrant.Role, { cache: true });
        if (registrantRole) {
          member.roles.add(registrantRole, "Auto Name Service");
        } else {
          this.logger.warn(
            `Could not find Registrant Role instance, skipping role assignment for discord id ${registrant.discord_user_id}`,
          );
          return false;
        }
      }
      // Set organizer role
      if (registrant.is_organizer && !member.roles.cache.has(CONFIG.Organizer.Role)) {
        // Fetch organizer role
        const organizerRole = await guild.roles.fetch(CONFIG.Organizer.Role, { cache: true });
        if (organizerRole) {
          member.roles.add(organizerRole, "Auto Name Service");
        } else {
          this.logger.warn(
            `Could not find Organizer Role instance, skipping role assignment for discord id ${registrant.discord_user_id}`,
          );
        }
      }
    } catch (err) {
      this.logger.error("Could not update discord member values. Possible lack of permission", err);
      return false;
    }
    return true;
  }

  /**
   * Sync all registrants discord data to account for dropped ws data
   */
  public async syncAllUsers(): Promise<void> {
    this.logger.info("Attempting batch update of users");
    this.client.apiWorker.registrantCache.forEach(reg => this.syncOneUser(reg));
  }
}
