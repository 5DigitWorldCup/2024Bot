import { z } from "zod";
import { RegistrantSchema } from "./RegistrantSchema";

export const RegistrantPageSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(RegistrantSchema),
});
