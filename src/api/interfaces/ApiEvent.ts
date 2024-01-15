import BaseEvent from "@common/interfaces/BaseEvent";

export type EventName = "open" | "close" | "error" | "message" | "register" | "delete" | "discord_switch";

export default interface ApiEvent extends BaseEvent {
  name: EventName;
}
