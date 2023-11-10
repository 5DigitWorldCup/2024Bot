import ApiEvent from "@api/interfaces/ApiEvent";

export default <ApiEvent>{
  name: "error",
  once: false,
  execute() {
    this.logger.info("Recieved error from websocket");
  },
};
