/* eslint-disable camelcase */
import { z } from "zod";

export const RegistrantSchema = z.object({
  discord_user_id: z.string(),
  osu_username: z.string(),
  is_organizer: z.boolean(),
});
