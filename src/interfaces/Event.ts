import { Logger } from "@common/Logger";

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
export default interface Event {
  /**
   * Use discord.js `Events` enums
   */
  name: string
  /**
   * The function that will be invoked when an event is fired as `Event.name`
   * 
   * @param args The expected arguments discord.js will pass to command
   */
  execute(...args: any): any;
  /**
   * Whether this event will only be listened for a singular time or an indefinite amount of times
   * Determines `client.once()` or `client.on()`
   */
  once?: boolean;
  /**
   * Child logger specific to each event implementation
   */
  logger: Logger
}