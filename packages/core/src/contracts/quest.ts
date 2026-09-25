/** Квест — поручение региона: сцены, наборы упражнений, пересказ, награда (task.md RF-3, RF-8). */
import { z } from "zod";
import { elementIdSchema } from "./element";
import { exerciseSchema } from "./exercise";
import { sceneSchema } from "./scene";

export const chestSchema = z.enum(["common", "rich", "precious"]);

export const questStepSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("scene"),
    scene: sceneSchema,
  }),
  z.object({
    kind: z.literal("exercises"),
    titleRu: z.string().min(1, "У блока упражнений нет названия"),
    mentorId: z.string().min(1),
    items: z.array(exerciseSchema).min(1).max(8),
  }),
  z.object({
    kind: z.literal("retell"),
    titleRu: z.string().min(1, "У блока пересказа нет названия"),
    sceneIds: z.array(z.string().min(1)).min(3).max(6),
  }),
  z.object({
    kind: z.literal("reward"),
    chest: chestSchema,
  }),
]);

export const questSchema = z.object({
  id: z
    .string({ error: "У квеста отсутствует id" })
    .regex(/^[a-z0-9-]+$/, "id квеста: латиница, цифры, дефис"),
  regionId: z.string({ error: "Квест без regionId" }).min(1),
  titleRu: z.string().min(1, "У квеста нет названия"),
  kind: z.enum(["commission", "choice", "archon"]),
  element: elementIdSchema.optional(),
  estimatedMinutes: z.number().int().min(1).max(20),
  steps: z.array(questStepSchema).min(1),
  cliffhangerRu: z.string().optional(),
});

export type Quest = z.infer<typeof questSchema>;
export type QuestStep = z.infer<typeof questStepSchema>;
export type Chest = z.infer<typeof chestSchema>;
