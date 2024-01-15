import { DiscordSwitchSchema } from "@api/schema/DiscordSwitchSchema";
import type { z } from "zod";

export type DiscordSwitch = z.infer<typeof DiscordSwitchSchema>;
