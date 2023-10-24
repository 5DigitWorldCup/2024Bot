import ExtendedClient from "@common/ExtendedClient";
import Logger from "@common/Logger";

ExtendedClient.deployCommands().then(Logger(module).info).catch(Logger(module).error);
