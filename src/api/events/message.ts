import ApiEvent from "@api/interfaces/ApiEvent";

export default <ApiEvent>{
  name: "message",
  once: false,
  execute() {
    this.logger.info("Recieved message from websocket");
  },
};
