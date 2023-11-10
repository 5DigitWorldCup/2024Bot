import BaseEvent from "@common/interfaces/BaseEvent";

export type EventName = "open" | "close" | "error" | "message";

export default interface ApiEvent extends BaseEvent {
  name: EventName;
}
