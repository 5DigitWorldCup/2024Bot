import { RegistrantSchema } from "@api/schema/RegistrantSchema";
import type { z } from "zod";

export type Registrant = z.infer<typeof RegistrantSchema>;
