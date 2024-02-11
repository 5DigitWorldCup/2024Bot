/* eslint-disable camelcase */
import { z } from "zod";
import { RegistrantSchema } from "./RegistrantSchema";

export const RawRegistrantSchema = RegistrantSchema.extend({
  url: z.string(),
  user_id: z.number(),
  discord_username: z.string(),
  osu_user_id: z.number(),
  in_backup_roster: z.boolean(),
  is_captain: z.boolean(),
  osu_stats_updated: z.string(),
  rank_standard: z.number(),
  rank_standard_bws: z.number(),
  team: z.string(),
});
