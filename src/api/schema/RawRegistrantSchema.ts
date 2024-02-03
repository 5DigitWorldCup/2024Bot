/* eslint-disable camelcase */
import { z } from "zod";
import { RegistrantSchema } from "./RegistrantSchema";

export const RawRegistrantSchema = RegistrantSchema.extend({
  url: z.string(),
  user_id: z.number(),
  discord_username: z.string(),
  osu_user_id: z.number(),
  team: z.string(),
  osu_stats_updated: z.string(),
  in_backup_roster: z.boolean(),
  rank_standard: z.number(),
  rank_standard_bws: z.number(),
});
