import ExtendedClient from "@common/ExtendedClient";
import Logger from "@common/Logger";

ExtendedClient.clearCommands().then(Logger(module).info).catch(Logger(module).error);
