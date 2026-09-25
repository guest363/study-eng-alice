/** Регион карты — тематический блок курса (task.md §4.3). */
import { z } from "zod";
import { mediaKeySchema } from "./common";
import { elementIdSchema } from "./element";

export const regionSchema = z.object({
  id: z
    .string({ error: "У региона отсутствует id" })
    .regex(/^[a-z0-9-]+$/, "id региона: латиница, цифры, дефис"),
  slug: z.string().min(1),
  nameRu: z.string().min(1, "У региона нет названия"),
  subtitleRu: z.string().min(1, "У региона нет подзаголовка"),
  order: z.number().int().min(1).max(7),
  mentors: z.array(z.string().min(1)).min(1, "У региона должен быть хотя бы один наставник"),
  elementAccent: elementIdSchema.optional(),
  storyRu: z.string().min(1, "У региона нет сюжетного вступления"),
  media: z
    .object({
      backdrop: mediaKeySchema.optional(),
    })
    .default({}),
});

export type Region = z.infer<typeof regionSchema>;
