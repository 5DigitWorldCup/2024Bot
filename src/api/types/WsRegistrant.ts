import { WsRegistrantSchema } from "@api/schema/WsRegistrantSchema";
import type { z } from "zod";

export type WsRegistrant = z.infer<typeof WsRegistrantSchema>;
