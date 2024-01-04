import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";
import { RegistrantSchema } from "@api/schema/RegistrantSchema";

export default <ApiEvent>{
  name: "message",
  once: false,
  async execute(worker: ApiWorker, ev) {
    let innerData;
    try {
      const data = JSON.parse(ev) as { message: string };
      innerData = JSON.parse(data.message);
    } catch (err) {
      this.logger.warn("Received an invalid message from the websocket");
      return;
    }

    const parsed = RegistrantSchema.safeParse(JSON.parse(innerData.message));
    if (parsed.success) {
      // Add new registrants to the cache
      worker.registrantCache.set(parsed.data.discord_user_id, parsed.data);
      worker.client.autoNameService.syncOneUser(parsed.data);
      worker.client.autoNameService.announceRegistrant(parsed.data);
    } else {
      this.logger.warn("Received invalid message data from the websocket");
    }
  },
};
