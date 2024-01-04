import { RawRegistrantSchema } from "@api/schema/RawRegistrantSchema";
import type { z } from "zod";

export type RawRegistrant = z.infer<typeof RawRegistrantSchema>;
