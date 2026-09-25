import { z } from "zod";
import { ELEMENT_IDS } from "../elements";

/** id одной из семи стихий. */
export const elementIdSchema = z.enum(ELEMENT_IDS);

export type ElementIdValue = z.infer<typeof elementIdSchema>;
