import { UserResolvable, RoleResolvable } from "discord.js";

interface Config {
  Bot: {
    Token: string;
    ClientId: string;
    GuildId: string;
  };
  Organizer: {
    Whitelist: UserResolvable[];
    Role: RoleResolvable;
  };
  Registrant: {
    Role: RoleResolvable;
  };
}

import * as cfg from "../config.json";
export const CONFIG: Config = cfg;
