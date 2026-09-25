/**
 * Подписи интерфейса, которые движок отдаёт по идентификатору. Текст игры живёт
 * в контенте (packages/content/src/ui/labels.json), в коде его быть не должно
 * (agent.md, правило 7).
 */
import { z } from "zod";
import { srsGradeSchema } from "./progress";

export const labelsSchema = z.object({
  /** Кнопки сада слов: подписи оценки повторения (RF-5.1). */
  srsGrade: z.object({
    remembered: z.string().min(1, "Нет подписи для оценки «вспомнила»"),
    hinted: z.string().min(1, "Нет подписи для оценки «подскажи»"),
    forgotten: z.string().min(1, "Нет подписи для оценки «не вспомнила»"),
  }),
  /** Кнопки действий внутри упражнений (RF-4.3, RF-4.5). */
  actions: z.object({
    said: z.string().min(1, "Нет подписи кнопки «Я сказал!»"),
    build: z.string().min(1, "Нет подписи кнопки сборки фразы"),
    replay: z.string().min(1, "Нет подписи кнопки повтора звука"),
  }),
});

export type Labels = z.infer<typeof labelsSchema>;

/** Ключ оценки повторения совпадает с ключом подписи — проверяем схемой. */
export const srsGradeLabelKeys = srsGradeSchema.options;
