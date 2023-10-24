import { GatewayIntentBits } from "discord.js";
import ExtendedClient from "@common/ExtendedClient";
import "config";

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds],
  rest: {
    timeout: 80_000,
  },
});

client.init();
client.login();
