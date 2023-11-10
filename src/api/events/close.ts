import ApiEvent from "@api/interfaces/ApiEvent";

export default <ApiEvent>{
  name: "close",
  once: false,
  execute() {
    this.logger.info("Connection to websocket closed");
  },
};
