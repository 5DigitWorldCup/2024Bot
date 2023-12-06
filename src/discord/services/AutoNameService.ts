import ApiWorker from "@api/ApiWorker";
import TournamentPlayer from "@api/interfaces/TournamentPlayer";
import WsResponse from "@api/interfaces/WSResponse";
import Logger from "@common/Logger";
import ExtendedClient from "@discord/ExtendedClient";
import CONFIG from "config";

export default class AutoNameService {
  readonly logger = Logger(module);
  readonly client: ExtendedClient;
  readonly refreshDelay = 21600000;
  constructor(client: ExtendedClient) {
    this.client = client;
    setInterval(this.syncAllUsers, this.refreshDelay);
  }

  /**
   * Set the target registrant's discord profile to use the registrant role and their osu! username
   * @param registrant The raw data object representing a player
   */
  async updateOneUser(registrant: TournamentPlayer | WsResponse): Promise<void> {
    // Fetch our guild instance
    let guild;
    try {
      guild = await this.client.guilds.fetch(CONFIG.Bot.GuildId);
    } catch {
      this.logger.error("Could not find Guild instance");
      return;
    }
    // Fetch the target guildMember
    let member;
    try {
      member = await guild.members.fetch({ user: registrant.discord_user_id, cache: true });
    } catch {
      this.logger.warn(`Could not find guildMember instance [Discord id: ${registrant.discord_user_id}]`);
      return;
    }
    // Update discord member values
    if (member.displayName !== registrant.osu_username) {
      member.setNickname(registrant.osu_username, "Auto Name Service");
    }
    if (!member.roles.cache.has(CONFIG.Registrant.Role)) {
      // Fetch registrant role
      const registrantRole = await guild.roles.fetch(CONFIG.Registrant.Role, { cache: true });
      if (!registrantRole) {
        this.logger.error(`Could not find Registrant Role instance`);
        return;
      }
      // Update user
      member.roles.add(registrantRole, "Auto Name Service");
    }
  }

  /**
   * Sync all registrants discord data to account for dropped ws data
   */
  async syncAllUsers(): Promise<void> {
    this.logger.info("Attempting batch update of users");
    let registrants;
    try {
      registrants = await ApiWorker.getAllRegistrants();
    } catch (err) {
      if (err instanceof Error) this.logger.error(err);
      this.logger.error("Could not get registrants. Is the api down?");
      return;
    }

    for (const player of registrants) this.updateOneUser(player);
  }
}
