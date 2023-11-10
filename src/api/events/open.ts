import ApiEvent from "api/interfaces/ApiEvent";

export default <ApiEvent>{
  name: "open",
  once: false,
  execute() {
    this.logger.info("Connection to websocket opened");
  },
};
