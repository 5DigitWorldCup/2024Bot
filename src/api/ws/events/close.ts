import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";

export default <ApiEvent>{
  name: "close",
  once: false,
  async execute(worker: ApiWorker) {
    // Set exponential recon timer
    let reconTimer = Math.pow(2, worker.nReconAttempts);
    reconTimer = reconTimer > 300 ? 300 : reconTimer;
    this.logger.warn(`Connection to websocket was closed, attempting reconnect in ${reconTimer} seconds`);
    // Attempt recon
    setTimeout(() => {
      worker.ws = worker.createWebsocket();
      worker.bindEvents(worker.ws, "ws/events");
      this.logger.info("Bound events to websocket");
    }, reconTimer * 1000);
    worker.nReconAttempts++;
  },
};
