import { Logger } from "@common/Logger";

export default interface BaseEvent {
  /**
   * The function that will be invoked when an event is fired as `Event.name`
   *
   * @param args The expected arguments discord.js will pass to command
   */
  execute(...args: any): any;
  /**
   * Whether this event will only be listened for a singular time or an indefinite amount of times
   * Determines `listener.once()` or `listener.on()`
   */
  once?: boolean;
  /**
   * Child logger specific to each event implementation
   */
  logger: Logger;
}
