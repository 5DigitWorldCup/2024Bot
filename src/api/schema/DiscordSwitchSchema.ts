/* eslint-disable camelcase */
import { z } from "zod";

export const DiscordSwitchSchema = z.object({
  old_discord_user_id: z.string(),
  new_discord_user_id: z.string(),
});
