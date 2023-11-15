import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";

export default <ApiEvent>{
  name: "message",
  once: false,
  execute(worker: ApiWorker, ev: string) {
    this.logger.info("Recieved message from websocket");
    this.logger.info(ev);
  },
};
