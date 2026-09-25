/** Общие примитивы контрактов контента. */
import { z } from "zod";

/** Ключ в медиа-манифесте. Код никогда не обращается к файлам напрямую (agent.md, правило 8). */
export const mediaKeySchema = z.string().min(1, "Ключ медиа не может быть пустым");

/** Источник звука: TTS сейчас, записанный файл — позже, без изменения контента (task.md §8.4). */
export const audioSourceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("tts"),
    voice: z.enum(["us", "uk"]).default("us"),
    rate: z.number().min(0.5).max(1.2).default(0.85),
  }),
  z.object({
    kind: z.literal("file"),
    src: mediaKeySchema,
  }),
]);

/** Пара «английское — русское». */
export const bilingualSchema = z.object({
  en: z.string().min(1, "Английская часть пары пуста"),
  ru: z.string().min(1, "Русская часть пары пуста"),
});

export type AudioSource = z.infer<typeof audioSourceSchema>;
export type Bilingual = z.infer<typeof bilingualSchema>;
