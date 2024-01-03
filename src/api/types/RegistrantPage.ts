import { RegistrantPageSchema } from "@api/schema/RegistrantPageSchema";
import type { z } from "zod";

export type RegistrantPage = z.infer<typeof RegistrantPageSchema>;
