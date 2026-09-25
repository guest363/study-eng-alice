/** Упражнение — дискриминированное объединение из семи типов (task.md RF-4). */
import { z } from "zod";

export const exerciseSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("listen-pick"),
    wordId: z.string().min(1),
    distractorIds: z.array(z.string().min(1)).min(2, "Нужно минимум 2 дистрактора").max(3),
  }),
  z.object({
    type: z.literal("say-back"),
    wordId: z.string().min(1),
  }),
  z.object({
    type: z.literal("echo-sound"),
    wordId: z.string().min(1),
    focusSound: z.string().optional(),
  }),
  z.object({
    type: z.literal("build-phrase"),
    wordId: z.string().min(1),
  }),
  z.object({
    type: z.literal("quick-match"),
    wordIds: z.array(z.string().min(1)).min(3).max(4),
  }),
  z.object({
    type: z.literal("garden-water"),
    wordIds: z.array(z.string().min(1)).min(1).max(8),
  }),
  z.object({
    type: z.literal("read-freeze"),
    wordId: z.string().min(1),
    mode: z.enum(["pick", "letters"]),
  }),
]);

export type Exercise = z.infer<typeof exerciseSchema>;
