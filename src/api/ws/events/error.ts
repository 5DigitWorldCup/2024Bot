import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";
import { ErrorEvent } from "ws";

export default <ApiEvent>{
  name: "error",
  once: false,
  execute(worker: ApiWorker, err: ErrorEvent) {
    this.logger.error("Recieved error from websocket, closing socket ", err.message);
    worker.ws.close();
  },
};
