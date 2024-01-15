import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";

export default <ApiEvent>{
  name: "open",
  once: false,
  async execute(worker: ApiWorker) {
    this.logger.info("Connection to websocket opened");
    // Reset the connection attempts upon success
    worker.nReconAttempts = 0;
    // Sync all users to account for dropped data
    if (worker.client.isReady()) {
      await worker.client.apiWorker.populateCache();
      worker.client.autoNameService.syncAllUsers();
    }
  },
};
