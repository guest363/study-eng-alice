/** Реакция стихий — детерминированное комбо двух подряд заданий (task.md RF-7). */
import { z } from "zod";
import { elementIdSchema } from "./element";

export const reactionBonusSchema = z.enum([
  "xp-x2",
  "crystals-2",
  "interval-plus",
  "star-protect",
  "accent-swap",
]);

export const reactionSchema = z.object({
  id: z
    .string({ error: "У реакции отсутствует id" })
    .regex(/^[a-z0-9-]+$/, "id реакции: латиница, цифры, дефис"),
  nameRu: z.string().min(1, "У реакции нет названия"),
  from: elementIdSchema,
  to: elementIdSchema.or(z.literal("any")),
  bonus: reactionBonusSchema,
  descriptionRu: z.string().min(1, "У реакции нет описания"),
});

export type Reaction = z.infer<typeof reactionSchema>;
export type ReactionBonus = z.infer<typeof reactionBonusSchema>;

/** Таблица реакций (reactions.json). */
export const reactionListSchema = z.array(reactionSchema);
