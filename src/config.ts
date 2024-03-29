interface Config {
  Bot: {
    /**
     * Bot token
     */
    Token: string;
    /**
     * Bot client id
     */
    ClientId: string;
    /**
     * Home guild id
     */
    GuildId: string;
  };
  Api: {
    /**
     * Base uri of the api
     */
    BaseUrl: string;
    /**
     * Pre-shared authentication key for non-safe methods
     */
    PSK: string;
    /**
     * Polling delay in seconds for refreshing registrant cache
     */
    RefreshDelay: number;
  };
  Organizer: {
    /**
     * Array of user ids allowed to use the /organizer command
     */
    Whitelist: string[];
    /**
     * Organizer role id
     */
    Role: string;
  };
  Registrant: {
    /**
     * Registrant role id
     */
    Role: string;
    /**
     * Registrant announcement channel id
     */
    Channel: string;
  };
  Staff: {
    /**
     * Staff role id
     */
    Role: string;
  };
  TeamRoles: {
    /**
     * Player role id
     */
    Player: string;
    /**
     * Captain role id
     */
    Captain: string;
  };
}

import * as cfg from "../config.json";
const CONFIG: Config = cfg;
export default CONFIG;
