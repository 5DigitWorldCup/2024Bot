import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";
import { ErrorEvent } from "ws";

export default <ApiEvent>{
  name: "error",
  once: false,
  execute(apiWorker: ApiWorker, err: ErrorEvent) {
    this.logger.error(err);
    this.logger.error("Recieved error from websocket, closing socket.");
    apiWorker.ws.close();
  },
};
