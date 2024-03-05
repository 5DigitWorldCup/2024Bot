/* eslint-disable camelcase */
import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";
import { DiscordSwitchSchema } from "@api/schema/DiscordSwitchSchema";

export default <ApiEvent>{
  name: "discord_switch",
  once: false,
  async execute(worker: ApiWorker, data: any) {
    const parsed = DiscordSwitchSchema.safeParse(data);
    if (!parsed.success) {
      this.logger.warn("Received invalid message data from the websocket");
      return;
    }
    // Update registrant cache with new user
    const registrant = worker.registrantCache.get(parsed.data.old_discord_user_id);
    // NOTE There is technically a race condition here with the cache being flushed.
    // The cache happens to be rebuilt at the same time / while this is executing,
    // the old user will no longer exist in the cache. But this will be fixed the
    // next time the cache is rebuilt anyway so it is a non-issue
    if (registrant) {
      registrant.discord_user_id = parsed.data.new_discord_user_id;
      worker.client.autoNameService.syncOneUser(registrant);
    }
    // Remove roles from old discord user
    worker.client.autoNameService.syncOneUser(
      {
        discord_user_id: parsed.data.old_discord_user_id,
        osu_username: "",
        is_organizer: false,
        in_roster: false,
        team_id: "WYSI",
        osu_flag: "WYSI",
        is_captain: false,
      },
      true,
    );
  },
};
