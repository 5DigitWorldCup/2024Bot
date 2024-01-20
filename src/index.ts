import "module-alias/register";
import { GatewayIntentBits } from "discord.js";
import ExtendedClient from "@discord/ExtendedClient";
import CONFIG from "@/config";

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  rest: {
    timeout: 80_000,
  },
});

client.init();
client.login(CONFIG.Bot.Token);
