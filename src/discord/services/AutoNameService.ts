import type { Registrant } from "@api/types/Registrant";
import { countryCodeToFull, countryCodeToEmoji } from "@api/util/Countries";
import Logger from "@common/Logger";
import ExtendedClient from "@discord/ExtendedClient";
import { getGuild } from "@discord/util/Wrappers";
import CONFIG from "config";
import { Guild, GuildMember, Role, userMention } from "discord.js";
import { coloredEmbed } from "@discord/util/Replies";

export default class AutoNameService {
  private readonly logger = Logger(module);
  public readonly client: ExtendedClient;
  /**
   * Delay for rebuilding the registrant cache and syncing user in seconds
   *
   * Default -- 900 seconds (15 minutes)
   */
  private readonly refreshDelay = CONFIG.Api.RefreshDelay;
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
   * @param regisrant The raw data object representing a player
   */
  public async announceRegistrant(regisrant: Registrant): Promise<void> {
    const channel = await this.client.channels.fetch(CONFIG.Registrant.Channel, { cache: true });
    if (!channel) {
      this.logger.error("Could not find registrant announce Channel, skipping welcome embed");
      return;
    }
    const embed = coloredEmbed()
      .setDescription("Welcome to 5WC!")
      .addFields(
        { name: "Discord", value: userMention(regisrant.discord_user_id), inline: true },
        { name: "osu!", value: regisrant.osu_username, inline: true },
      );
    if (channel.isTextBased()) await channel.send({ embeds: [embed] });
  }

  /**
   * Set the target registrant's discord profile to use the registrant role and their osu! username
   * @param registrant The raw data object representing a player
   */
  public async syncOneUser(registrant: Registrant): Promise<void> {
    // Fetch guild instance
    const guild = await getGuild(this.client);
    if (!guild) {
      this.logger.error(
        `Failed to get Guild instance, skipping update of discord member values [Discord id: ${registrant.discord_user_id}]`,
      );
      return;
    }
    // Fetch the target guildMember
    let member;
    try {
      member = await guild.members.fetch({ user: registrant.discord_user_id, cache: true });
    } catch {
      this.logger.warn(
        `Failed to get guildMember instance, skipping update of discord member values [Discord id: ${registrant.discord_user_id}]`,
      );
      return;
    }
    // Big try/catch here to avoid any crashes with missing perms
    try {
      this.setOneNickname(registrant, member);
      this.setOneRegistrantRole(registrant, guild, member);
      this.setOneOrganizerRole(registrant, guild, member);
      this.setOneTeamRole(registrant, guild, member);
    } catch (err) {
      this.logger.error("Failed to complete update of discord member values, an uncaught error occurred", err);
    }
  }

  /**
   * Sync all registrants discord data to account for dropped ws data
   */
  public async syncAllUsers(): Promise<void> {
    this.logger.info("Attempting batch update of users");
    this.client.apiWorker.registrantCache.forEach(reg => this.syncOneUser(reg));
  }

  /**
   * Set discord username to osu! username
   */
  private async setOneNickname(registrant: Registrant, member: GuildMember): Promise<void> {
    if (member.displayName === registrant.osu_username) return;

    try {
      member.setNickname(registrant.osu_username, "Auto Name Service");
    } catch (err) {
      this.logger.error(
        `Failed to set nickname, possible lack of permission [Discord id: ${registrant.discord_user_id}]`,
        err,
      );
    }
  }

  /**
   * Add the registrant role to a user
   */
  private async setOneRegistrantRole(registrant: Registrant, guild: Guild, member: GuildMember): Promise<void> {
    if (member.roles.cache.has(CONFIG.Registrant.Role)) return;

    const registrantRole = await guild.roles.fetch(CONFIG.Registrant.Role, { cache: true });
    if (!registrantRole) {
      this.logger.warn(
        `Could not find Registrant Role instance, skipping role assignment [Discord id: ${registrant.discord_user_id}]`,
      );
      return;
    }

    try {
      await member.roles.add(registrantRole, "Auto Role Service");
    } catch (err) {
      this.logger.error(
        `Failed to assign Registrant role, possible lack of permission [Discord id: ${registrant.discord_user_id}]`,
        err,
      );
    }
  }

  /**
   * Add the organizer role to a user
   */
  private async setOneOrganizerRole(registrant: Registrant, guild: Guild, member: GuildMember): Promise<void> {
    // Set organizer role
    if (!registrant.is_organizer || member.roles.cache.has(CONFIG.Organizer.Role)) return;

    const organizerRole = await guild.roles.fetch(CONFIG.Organizer.Role, { cache: true });
    if (!organizerRole) {
      this.logger.warn(
        `Could not find Organizer Role instance, skipping role assignment [Discord id: ${registrant.discord_user_id}]`,
      );
      return;
    }

    try {
      await member.roles.add(organizerRole, "Auto Role Service");
    } catch (err) {
      this.logger.error(
        `Failed to assign Organizer role, possible lack of permission [Discord id: ${registrant.discord_user_id}]`,
        err,
      );
    }
  }

  /**
   * Creates a team role with name and emoji
   * @param code ISO country code
   * @returns Dicord role instance
   */
  private async createCountryRole(code: string, guild: Guild): Promise<Role | undefined> {
    // Fetch our guild instance
    const countryName = countryCodeToFull(code);
    const countryEmoji = countryCodeToEmoji(code);
    let role;
    try {
      role = await guild.roles.create({
        name: `Team ${countryName}`,
        unicodeEmoji: countryEmoji,
        reason: "Auto Role Service",
      });
    } catch (err) {
      this.logger.error(`Failed to create team role: [Country: ${code}]`, err);
    }
    return role;
  }

  /**
   * Add a team role to a user
   */
  private async setOneTeamRole(registrant: Registrant, guild: Guild, member: GuildMember): Promise<void> {
    // Set team role
    if (!registrant.team_id || registrant.team_id === "WYSI") return;

    const teamName = countryCodeToFull(registrant.team_id);
    if (!teamName) {
      this.logger.warn(`No existing conversion for country code [Code: ${registrant.team_id}]`);
      return;
    }

    let teamRole = guild.roles.cache.find(role => role.name === teamName);
    if (!teamRole) {
      this.logger.info(`No existing team role, attempting to create [Country: ${registrant.team_id}]`);
      teamRole = await this.createCountryRole(registrant.team_id, guild);
      if (!teamRole) {
        this.logger.warn(
          `Failed to create team role, skipping role assignment [Discord id: ${registrant.discord_user_id}]`,
        );
        return;
      }
    }

    try {
      await member.roles.add(teamRole);
    } catch (err) {
      this.logger.error(
        `Failed to assign team role, possible lack of permission [Discord id: ${registrant.discord_user_id}]`,
        err,
      );
    }
  }
}
