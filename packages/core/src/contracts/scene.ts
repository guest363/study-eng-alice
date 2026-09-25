/** Сцена — диалог с портретами и озвучкой (task.md RF-8.1). */
import { z } from "zod";
import { mediaKeySchema } from "./common";

export const sceneBeatSchema = z.object({
  /** id спутника, "paimon" или "narrator". */
  speakerId: z.string().min(1, "В реплике не указан говорящий"),
  textRu: z.string().min(1, "Реплика без русского текста"),
  textEn: z.string().optional(),
  /** Озвучить английскую часть реплики через TTS. */
  speakEn: z.boolean().default(false),
});

export const sceneSchema = z.object({
  id: z
    .string({ error: "У сцены отсутствует id" })
    .regex(/^[a-z0-9-]+$/, "id сцены: латиница, цифры, дефис"),
  background: mediaKeySchema.optional(),
  beats: z.array(sceneBeatSchema).min(1).max(6),
});

export type Scene = z.infer<typeof sceneSchema>;
export type SceneBeat = z.infer<typeof sceneBeatSchema>;
