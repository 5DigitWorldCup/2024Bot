/* eslint-disable camelcase */
import { z } from "zod";

export const WsRegistrantSchema = z.object({
  discord_user_id: z.string(),
  osu_username: z.string(),
  is_organizer: z.boolean(),
  osu_flag: z.string(),
});
