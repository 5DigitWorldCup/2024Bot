import BaseEvent from "@common/interfaces/BaseEvent";
import { Events } from "discord.js";

/**
 * Base client event interface
 *
 * @example
 * export default <Event> {
 * name: Events.Ready,
 * once: true,
 * async execute(client: ExtendedClient){
 *  ...
 *  }
 * }
 */
export default interface DiscordEvent extends BaseEvent {
  /**
   * Use discord.js `Events` enums
   */
  name: Events;
}
