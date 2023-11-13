import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";

export default <ApiEvent>{
  name: "close",
  once: false,
  async execute(apiWorker: ApiWorker) {
    // Set exponential recon timer
    let reconTimer = Math.pow(2, apiWorker.nReconAttempts);
    reconTimer = reconTimer > 300 ? 300 : reconTimer;
    this.logger.warn(`Connection to websocket was closed, attempting reconnect in ${reconTimer} seconds`);
    // Attempt recon
    setTimeout(() => {
      apiWorker.ws = apiWorker.createWebsocket();
      apiWorker.bindSocketEvents();
    }, reconTimer * 1000);
    apiWorker.nReconAttempts++;
  },
};
