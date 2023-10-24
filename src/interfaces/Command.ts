import { SlashCommandBuilder, ContextMenuCommandBuilder } from "discord.js";
import { Logger } from "@common/Logger";

type CommandData = SlashCommandBuilder | ContextMenuCommandBuilder;

/**
 * Base application command interface
 *
 * @example
 * export default <Command> {
 *  data: ...,
 *  async execute(interaction, client) {
 *    ...
 *  }
 * }
 */
export default interface Command {
  /**
   * This will be any type of discord application command builder instance
   */
  data: CommandData;
  /**
   * The function that will be invoked when trying to execute the body of an application command
   *
   * @param args The expected arguments discord.js will pass to command
   */
  execute(...args: any): any;
  /**
   * Used for internal hot-requiring when necessary
   */
  filePath?: string;
  /**
   * Child logger specific to each command implementation
   */
  logger: Logger;
}
