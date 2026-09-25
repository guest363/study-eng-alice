/** Спутник-наставник: реальный персонаж Genshin, ведущий упражнения своей стихии (task.md §4.2). */
import { z } from "zod";
import { mediaKeySchema } from "./common";
import { elementIdSchema } from "./element";

export const companionSchema = z.object({
  id: z
    .string({ error: "У спутника отсутствует id" })
    .regex(/^[a-z0-9-]+$/, "id спутника: латиница, цифры, дефис"),
  nameRu: z.string().min(1, "У спутника нет имени"),
  /** Стихия может отсутствовать (Паймон — вне стихий). */
  element: elementIdSchema.optional(),
  roleRu: z.string().min(1, "У спутника нет роли"),
  media: z
    .object({
      portrait: mediaKeySchema.optional(),
      icon: mediaKeySchema.optional(),
    })
    .default({}),
  praise: z.array(z.string().min(1)).min(3, "Нужно минимум 3 реплики похвалы"),
  almost: z.array(z.string().min(1)).min(3, "Нужно минимум 3 реплики «почти»"),
  hint: z.array(z.string().min(1)).min(2, "Нужно минимум 2 подсказки"),
});

export type Companion = z.infer<typeof companionSchema>;
