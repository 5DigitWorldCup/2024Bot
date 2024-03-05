/* eslint-disable camelcase */
import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";
import { Registrant } from "@api/types/Registrant";

export default <ApiEvent>{
  name: "delete",
  once: false,
  async execute(worker: ApiWorker, data: any) {
    if (!Object.hasOwn(data, "discord_user_id")) {
      this.logger.warn("Received an invalid message from the websocket");
    }
    const dummyRegistrant: Registrant = {
      discord_user_id: data.discord_user_id,
      osu_username: "",
      is_organizer: false,
      in_roster: false,
      team_id: "WYSI",
      osu_flag: "WYSI",
      is_captain: false,
    };
    // Revert user roles
    worker.client.autoNameService.syncOneUser(dummyRegistrant, true);
    // Remove from cache
    worker.registrantCache.delete(dummyRegistrant.discord_user_id);
  },
};
