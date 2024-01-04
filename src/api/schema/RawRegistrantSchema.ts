/* eslint-disable camelcase */
import { z } from "zod";

export const RawRegistrantSchema = z.object({
  url: z.string(),
  user_id: z.number(),
  discord_user_id: z.string(),
  discord_username: z.string(),
  osu_user_id: z.number(),
  osu_username: z.string(),
  osu_flag: z.string(),
  is_organizer: z.boolean(),
  in_roster: z.boolean(),
  team_id: z.string(),
  team: z.string(),
});
