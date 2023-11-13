import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";

export default <ApiEvent>{
  name: "open",
  once: false,
  execute(apiWorker: ApiWorker) {
    this.logger.info("Connection to websocket opened");
    // Reset the connection attempts upon success
    apiWorker.nReconAttempts = 0;
  },
};