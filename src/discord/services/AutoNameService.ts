/* eslint-disable camelcase */
import type { Registrant } from "@api/types/Registrant";
import { countryCodeToFull, countryCodeToEmoji } from "@api/util/Countries";
import Logger from "@common/Logger";
import ExtendedClient from "@discord/ExtendedClient";
import { getAllRoles, getMember, isStaff } from "@discord/util/Wrappers";
import CONFIG from "@/config";
import { Guild, GuildMember, Role, bold } from "discord.js";
import ApiWorker from "@api/ApiWorker";

export default class AutoNameService {
  private readonly logger = Logger(module);
  public readonly client: ExtendedClient;
  private refreshHandle!: NodeJS.Timeout;
  private refreshTimeout: number;
  private nextRefresh!: number;
  private teamRolesEnabled: boolean = false;
  constructor(client: ExtendedClient) {
    this.client = client;
    // Set reocurring tasks
    this.refreshTimeout = CONFIG.Api.RefreshDelay;
    this.setRefresh(this.refreshTimeout);
  }

  /**
   * Sets the refresh interval
   * @param timeout Interval for refresh in seconds
   */
  public setRefresh(timeout: number): void {
    this.refreshTimeout = timeout;
    this.nextRefresh = Date.now() + timeout * 1000;
    if (this.refreshHandle) clearInterval(this.refreshHandle);
    this.refreshHandle = setInterval(async () => {
      await this.client.apiWorker.populateCache();
      await this.syncAllUsers();
      this.nextRefresh = Date.now() + timeout * 1000;
    }, timeout * 1000);
  }

  /**
   * Getter for `nextRefresh` timestamp
   */
  public getNextRefresh(): number {
    return this.nextRefresh;
  }

  /**
   * Setter for `teamRolesEnabled` flag
   */
  public setTeamRolesEnabled(enabled: boolean): void {
    this.teamRolesEnabled = enabled;
  }

  /**
   * Getter for `teamRolesEnabled` flag
   */
  public getTeamRolesEnabled(): boolean {
    return this.teamRolesEnabled;
  }

  /**
   * Announce a new registrant to the discord
   * @param regisrant The raw data object representing a player
   */
  public async announceRegistrant(regisrant: Registrant): Promise<void> {
    const channel = await this.client.channels.fetch(CONFIG.Registrant.Channel, { cache: true });
    if (!channel) {
      this.logger.error("Failed to find registrant announce Channel, skipping welcome embed");
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
  public async syncOneUser(registrant: Registrant, remove: boolean = false): Promise<boolean> {
    // Fetch member instance
    const member = await getMember(registrant.discord_user_id, this.client);
    if (!member) return false;
    // Filter out any future and existing staff members
    if (isStaff(member)) {
      await this.updateOneStaff(member);
      this.logger.info(`Staff member filtered [Discord id: ${member.id}]`);
      // Remove any existing roles if staff
      remove = true;
      // Reset username
      registrant.osu_username = "";
    }
    // Big try/catch here to avoid any crashes with missing perms
    try {
      this.setOneNickname(member, registrant.osu_username);
      this.setOneRegistrantRole(member, remove);
      this.setOneOrganizerRole(member, registrant.is_organizer, remove);
      if (this.teamRolesEnabled) {
        this.setOnePlayerRole(member, registrant.in_roster, remove);
        this.setOneCaptainRole(member, registrant.is_captain, remove);
        this.setOneTeamRole(member, registrant.in_roster, registrant.team_id, remove);
      }
    } catch (err) {
      this.logger.error("Failed to complete update of discord member values, an uncaught error occurred", err);
      return false;
    }
    return true;
  }

  /**
   * Sync all registrants discord data to account for dropped ws data
   */
  public async syncAllUsers(): Promise<void> {
    this.logger.info("Attempting batch update of users");
    let count = 0;
    for (const [, regisrant] of this.client.apiWorker.registrantCache) {
      const ok = await this.syncOneUser(regisrant);
      ok ? null : count++;
    }
    this.logger.info(`Batch user update complete [Skipped users: ${count}]`);
  }

  /**
   * Deletes all but one instance of each team role from the server
   */
  public async cleanupTeamRoles(): Promise<boolean> {
    const roles = await getAllRoles(this.client);
    if (!roles) {
      this.logger.warn("Failed to fetch guild role list, aborting team role cleanup");
      return false;
    }

    const teamRoles = roles.filter(role => role.name.includes("Team"));
    const seenRoles: string[] = [];

    for (const [, role] of teamRoles) {
      if (seenRoles.includes(role.name)) {
        try {
          await role.delete("Cleanup team roles");
        } catch {
          this.logger.info(`Failed to delete team role [id: ${role.id}]`);
        }
      } else {
        seenRoles.push(role.name);
      }
    }
    return true;
  }

  /**
   * Deletes all team roles from the server
   */
  public async deleteAllTeamRoles(): Promise<boolean> {
    const roles = await getAllRoles(this.client);
    if (!roles) {
      this.logger.warn("Failed to fetch guild role list, aborting team role bulk deletion");
      return false;
    }

    const teamRoles = roles.filter(role => role.name.includes("Team"));
    let errCount = 0;
    for (const [, role] of teamRoles) {
      try {
        await role.delete("Delete all team roles");
      } catch {
        this.logger.info(`Failed to delete team role [id: ${role.id}]`);
        errCount++;
      }
    }
    this.logger.info(`Successfully deleted all team roles [Skipped roles: ${errCount}]`);
    return true;
  }

  /**
   * Will flag a user as staff in the database and remove any tourney related roles
   */
  private async updateOneStaff(member: GuildMember): Promise<void> {
    const { id } = member;
    const apiOk = await ApiWorker.updateStaff(id, true);
    apiOk
      ? this.logger.info(`Updated one staff member [Discord id: ${id}]`)
      : this.logger.warn(`Failed to update staff member [Discord id: ${id}]`);
    // Remove staff member from cache
    this.client.apiWorker.registrantCache.delete(id);
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
      this.logger.warn(`Failed to find Registrant Role instance, skipping role assignment [Discord id: ${id}]`);
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

    if (!isOrganizer && hasRole) {
      const apiOk = await ApiWorker.updateOrganizer(member.id, true);
      apiOk
        ? this.logger.info(`Granted organizer permissions [Discord id: ${member.id}]`)
        : this.logger.warn(`Failed to update organizer status [Discord id: ${member.id}]`);
    }
    if (isOrganizer && !hasRole) func = member.roles.add;
    if (hasRole && remove) func = member.roles.remove;
    if (!func) return;

    const { guild, id } = member;
    const organizerRole = await guild.roles.fetch(CONFIG.Organizer.Role, { cache: true });
    if (!organizerRole) {
      this.logger.warn(`Failed to find Organizer Role instance, skipping role assignment [Discord id: ${id}]`);
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

    // Remove role if remove flag set
    if (hasRole && remove) {
      const teamRole = member.roles.cache.find(role => role.name.includes("Team"));
      if (!teamRole) return;
      try {
        await member.roles.remove(teamRole);
        return;
      } catch (err) {
        this.logger.warn(`Failed to remove team role, possible lack of permission [Discord id: ${id}]`, err);
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

  /**
   * Add captain role to a user
   */
  private async setOneCaptainRole(member: GuildMember, isCaptain: boolean, remove: boolean = false) {
    const hasRole = member.roles.cache.has(CONFIG.TeamRoles.Captain);
    const func = remove ? member.roles.remove : member.roles.add;
    if (isCaptain && hasRole) return;
    // Patching this quickly but this means role removal won't work
    if (!isCaptain) return;
    if (remove && !hasRole) return;

    const { guild, id } = member;
    const captainRole = await guild.roles.fetch(CONFIG.TeamRoles.Captain, { cache: true });
    if (!captainRole) {
      this.logger.warn(`Failed to find Captain Role instance, skipping role assignment [Discord id: ${id}]`);
      return;
    }

    try {
      await func.bind(member.roles)(captainRole, "Auto Role Service");
    } catch (err) {
      this.logger.error(`Failed to assign Registrant role, possible lack of permission [Discord id: ${id}]`, err);
    }
  }

  /**
   * Add player role to a user
   */
  private async setOnePlayerRole(member: GuildMember, inRoster: boolean, remove: boolean = false) {
    if (!remove && member.roles.cache.has(CONFIG.TeamRoles.Player)) return;
    // Patching this quickly but this means role removal won't work
    if (!inRoster) return;
    const func = remove ? member.roles.remove : member.roles.add;

    const { guild, id } = member;
    const playerRole = await guild.roles.fetch(CONFIG.TeamRoles.Player, { cache: true });
    if (!playerRole) {
      this.logger.warn(`Failed to find Player Role instance, skipping role assignment [Discord id: ${id}]`);
      return;
    }

    try {
      await func.bind(member.roles)(playerRole, "Auto Role Service");
    } catch (err) {
      this.logger.error(`Failed to assign Player role, possible lack of permission [Discord id: ${id}]`, err);
    }
  }
}
