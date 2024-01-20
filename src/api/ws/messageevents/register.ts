/* eslint-disable camelcase */
import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";
import { WsRegistrantSchema } from "@api/schema/WsRegistrantSchema";
import { Registrant } from "@api/types/Registrant";

export default <ApiEvent>{
  name: "register",
  once: false,
  async execute(worker: ApiWorker, data: any) {
    const parsed = WsRegistrantSchema.safeParse(data);
    if (!parsed.success) {
      this.logger.warn("Received invalid message data from the websocket", parsed.error);
      return;
    }
    const d = parsed.data;
    const fullRegistrant: Registrant = {
      discord_user_id: d.discord_user_id,
      osu_username: d.osu_username,
      is_organizer: d.is_organizer,
      osu_flag: d.osu_flag,
      team_id: "WYSI",
      in_roster: false,
    };
    // Add new registrants to the cache
    worker.registrantCache.set(fullRegistrant.discord_user_id, fullRegistrant);
    // Try to set discord values
    worker.client.autoNameService.syncOneUser(fullRegistrant);
    // Announce registration
    worker.client.autoNameService.announceRegistrant(fullRegistrant);
  },
};
