/** Слово — атомарная лексическая единица курса (фразы тоже слова: partOfSpeech "phrase"). */
import { z } from "zod";
import { audioSourceSchema, bilingualSchema, mediaKeySchema } from "./common";
import { elementIdSchema } from "./element";

export const partOfSpeechSchema = z.enum([
  "noun",
  "verb",
  "adj",
  "adv",
  "pron",
  "num",
  "phrase",
  "excl",
]);

export const wordSchema = z.object({
  id: z
    .string({ error: "У слова отсутствует id" })
    .regex(/^[a-z0-9-]+$/, "id слова: только латиница в нижнем регистре, цифры и дефис"),
  en: z.string({ error: "У слова отсутствует английское значение (en)" }).min(1, "en пуст"),
  ru: z.string({ error: "У слова отсутствует русское значение (ru)" }).min(1, "ru пуст"),
  regionId: z.string({ error: "Слово без regionId" }).min(1),
  theme: z.string().min(1, "У слова должна быть тема (theme)"),
  partOfSpeech: partOfSpeechSchema,
  element: elementIdSchema.optional(),
  emoji: z.string().optional(),
  media: z
    .object({
      icon: mediaKeySchema.optional(),
      image: mediaKeySchema.optional(),
      audio: audioSourceSchema.optional(),
    })
    .default({}),
  example: bilingualSchema.optional(),
  tags: z.array(z.string()).default([]),
});

export type Word = z.infer<typeof wordSchema>;
export type PartOfSpeech = z.infer<typeof partOfSpeechSchema>;

/** Список слов региона (words.json). */
export const wordListSchema = z.array(wordSchema);
