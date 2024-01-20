import "module-alias/register";
import ExtendedClient from "@discord/ExtendedClient";
import Logger from "@common/Logger";

ExtendedClient.deployCommands().then(Logger(module).info).catch(Logger(module).error);
