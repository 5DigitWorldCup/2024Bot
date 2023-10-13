import { config } from "dotenv";
import { resolve } from "path";
import { z } from "zod";

const envName = process.env.NODE_ENV === "development" ? ".dev.env" : ".env";
config({ path: resolve(process.cwd(), envName) });

const envSchema = z.object({
  DISCORD_TOKEN: z.string(),
  CLIENT_ID: z.string(),
  GUILD_ID: z.string(),
});

export const ENV = envSchema.parse(process.env);