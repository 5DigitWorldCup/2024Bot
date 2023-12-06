import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";
import WsResponse from "@api/interfaces/WSResponse";

export default <ApiEvent>{
  name: "message",
  once: false,
  async execute(worker: ApiWorker, ev) {
    const data = JSON.parse(ev) as { message: string; level?: any };
    const player = JSON.parse(data.message) as WsResponse;
    try {
      await worker.client.autoNameService.updateOneUser(player);
    } catch (err) {
      this.logger.error("Unnexpected error with AutoNameService:");
      if (err instanceof Error) {
        this.logger.error(err.message);
      }
    }
  },
};
