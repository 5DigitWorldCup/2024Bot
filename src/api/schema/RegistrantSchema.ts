/* eslint-disable camelcase */
import { z } from "zod";
import { WsRegistrantSchema } from "@api/schema/WsRegistrantSchema";

export const RegistrantSchema = WsRegistrantSchema.extend({
  team_id: z.string(),
  in_roster: z.boolean(),
});
