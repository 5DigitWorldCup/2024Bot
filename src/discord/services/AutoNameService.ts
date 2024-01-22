import type { Registrant } from "@api/types/Registrant";
import { countryCodeToFull, countryCodeToEmoji } from "@api/util/Countries";
import Logger from "@common/Logger";
import ExtendedClient from "@discord/ExtendedClient";
import { getGuild, getMember } from "@discord/util/Wrappers";
import CONFIG from "@/config";
import { Guild, GuildMember, Role, bold } from "discord.js";

export default class AutoNameService {
  private readonly logger = Logger(module);
  public readonly client: ExtendedClient;
  /**
   * Delay for rebuilding the registrant cache and syncing user in seconds
   *
   * Default -- 900 seconds (15 minutes)
   */
  private readonly refreshDelay = CONFIG.Api.RefreshDelay;
  private refreshHandle!: NodeJS.Timeout;
  constructor(client: ExtendedClient) {
    this.client = client;
    // Set reocurring tasks
    this.setRefresh(CONFIG.Api.RefreshDelay);
  }

  public setRefresh(timeout: number): void {
    if (this.refreshHandle) clearInterval(this.refreshHandle);
    this.refreshHandle = setInterval(async () => {
      await this.client.apiWorker.populateCache();
      this.syncAllUsers();
    }, timeout * 1000);
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
    const flag = countryCodeToEmoji(regisrant.osu_flag) + " ";
    const text = `${flag}${bold(regisrant.osu_username)} has registered!`.trim();
    if (channel.isTextBased()) await channel.send({ content: text });
  }

  /**
   * Set the target registrant's discord profile to use the registrant role and their osu! username
   * @param registrant The raw data object representing a player
   */
  public async syncOneUser(registrant: Registrant, remove: boolean = false): Promise<void> {
    // Fetch member instance
    const member = await getMember(registrant.discord_user_id, this.client);
    if (!member) {
      this.logger.warn("Failed to find guildMember, skipping user sync");
      return;
    }
    // Big try/catch here to avoid any crashes with missing perms
    try {
      this.setOneNickname(member, registrant.osu_username);
      this.setOneRegistrantRole(member, remove);
      this.setOneOrganizerRole(member, registrant.is_organizer, remove);
      this.setOneTeamRole(member, registrant.in_roster, registrant.team_id, remove);
    } catch (err) {
      this.logger.error("Failed to complete update of discord member values, an uncaught error occurred", err);
    }
  }

  /**
   * Sync all registrants discord data to account for dropped ws data
   */
  public async syncAllUsers(): Promise<void> {
    this.logger.info("Attempting batch update of users");
    for (const [, regisrant] of this.client.apiWorker.registrantCache) {
      await this.syncOneUser(regisrant);
    }
    this.logger.info("Batch user update complete");
  }

  /**
   * Set discord username to osu! username
   */
  private async setOneNickname(member: GuildMember, newName: string): Promise<void> {
    if (member.displayName === newName) return;

    try {
      await member.setNickname(newName, "Auto Name Service");
    } catch (err) {
      this.logger.error(`Failed to set nickname, possible lack of permission [Discord id: ${member.id}]`, err);
    }
  }

  /**
   * Add the registrant role to a user
   */
  private async setOneRegistrantRole(member: GuildMember, remove: boolean = false): Promise<void> {
    if (!remove && member.roles.cache.has(CONFIG.Registrant.Role)) return;
    const func = remove ? member.roles.remove : member.roles.add;

    const { guild, id } = member;
    const registrantRole = await guild.roles.fetch(CONFIG.Registrant.Role, { cache: true });
    if (!registrantRole) {
      this.logger.warn(`Could not find Registrant Role instance, skipping role assignment [Discord id: ${id}]`);
      return;
    }

    try {
      await func.bind(member.roles)(registrantRole, "Auto Role Service");
    } catch (err) {
      this.logger.error(`Failed to assign Registrant role, possible lack of permission [Discord id: ${id}]`, err);
    }
  }

  /**
   * Add the organizer role to a user
   */
  private async setOneOrganizerRole(member: GuildMember, isOrganizer: boolean, remove: boolean = false): Promise<void> {
    // Set organizer role
    const hasRole = member.roles.cache.has(CONFIG.Organizer.Role);
    let func;

    if (isOrganizer && !hasRole) func = member.roles.add;
    if (hasRole && remove) func = member.roles.remove;
    if (!func) return;

    const { guild, id } = member;
    const organizerRole = await guild.roles.fetch(CONFIG.Organizer.Role, { cache: true });
    if (!organizerRole) {
      this.logger.warn(`Could not find Organizer Role instance, skipping role assignment [Discord id: ${id}]`);
      return;
    }

    try {
      await func.bind(member.roles)(organizerRole, "Auto Role Service");
    } catch (err) {
      this.logger.error(`Failed to set Organizer role, possible lack of permission [Discord id: ${id}]`, err);
    }
  }

  /**
   * Creates a team role with name and emoji
   * @param code ISO country code
   * @returns Dicord role instance
   */
  private async createTeamRole(code: string, guild: Guild): Promise<Role | undefined> {
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
  private async setOneTeamRole(
    member: GuildMember,
    inRoster: boolean,
    teamId: string,
    remove: boolean = false,
  ): Promise<void> {
    const hasRole = member.roles.cache.find(role => role.name.includes("Team")) ?? false;
    const { guild, id } = member;

    // Remove role if removing
    if (hasRole && remove) {
      const teamRole = member.roles.cache.find(role => role.name.includes("Team"));
      if (!teamRole) return;
      try {
        await member.roles.remove(teamRole);
        return;
      } catch (err) {
        this.logger.warn(`Failed to remove team role, possible lack of permission [Discord id: ${id}]`);
      }
      return;
    }
    // Skip if not in roster
    if (!inRoster) return;

    const teamName = countryCodeToFull(teamId);
    if (!teamName) {
      this.logger.warn(`No existing conversion for country code [Code: ${teamId}]`);
      return;
    }

    const teamEmoji = countryCodeToEmoji(teamId);
    let teamRole = guild.roles.cache.find(role => role.unicodeEmoji === teamEmoji);
    if (!teamRole) {
      this.logger.info(`No existing team role, attempting to create [Country: ${teamId}]`);
      teamRole = await this.createTeamRole(teamId, guild);
      if (!teamRole) {
        this.logger.warn(`Failed to create team role, skipping role assignment [Discord id: ${id}]`);
        return;
      }
    }

    try {
      await member.roles.add(teamRole);
    } catch (err) {
      this.logger.error(`Failed to assign team role, possible lack of permission [Discord id: ${id}]`, err);
    }
  }

  private async cleanupTeamRoles(): Promise<void> {
    const guild = await getGuild(this.client);
    if (!guild) return;

    let roles;
    try {
      roles = await guild.roles.fetch(undefined, { cache: true });
    } catch {
      this.logger.warn("Failed to fetch guild role list, aborting team role cleanup");
      return;
    }

    const teamRoles = roles.filter(role => role.name.includes("Team"));
    const seenRoles: string[] = [];

    teamRoles.forEach(async role => {
      if (seenRoles.includes(role.name)) {
        try {
          await role.delete();
        } catch {
          this.logger.info(`Failed to delete role [id: ${role.id}]`);
        }
      } else {
        seenRoles.push(role.name);
      }
    });
  }
}
