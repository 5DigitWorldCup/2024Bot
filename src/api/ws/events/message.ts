import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";

export default <ApiEvent>{
  name: "message",
  once: false,
  async execute(worker: ApiWorker, ev) {
    let innerData;
    try {
      const data = JSON.parse(ev) as { message: string };
      innerData = JSON.parse(data.message);
      if (!Object.hasOwn(innerData, "action")) {
        throw new Error("No property 'action' defined in websocket response");
      }
    } catch (err) {
      this.logger.warn("Received an invalid message from the websocket", err);
      return;
    }
    // Route action to it's handler implementation
    worker.wsMessageHandler.emit(innerData.action, innerData);
  },
};
