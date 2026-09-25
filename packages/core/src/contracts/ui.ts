/**
 * Подписи интерфейса, которые движок и экраны берут по идентификатору. Текст игры живёт
 * в контенте (packages/content/src/ui/labels.json) — в коде его быть не должно
 * (agent.md, правило 7).
 */
import { z } from "zod";
import { srsGradeSchema } from "./progress";

const caption = z.string().min(1, "Пустая подпись");

const captions = () => z.object({}).catchall(caption);

export const labelsSchema = z.object({
  /** Кнопки сада слов: подписи оценки повторения (RF-5.1). */
  srsGrade: z.object({
    remembered: caption,
    hinted: caption,
    forgotten: caption,
  }),
  /** Кнопки действий внутри упражнений (RF-4.3, RF-4.5). */
  actions: z.object({
    said: caption,
    build: caption,
    replay: caption,
    showAnswer: caption,
    next: caption,
    check: caption,
    /** Кнопка «Обычным голосом» — без замедления. */
    normalVoice: caption,
    /** Самозапись: записать и остановить. */
    record: caption,
    stop: caption,
  }),
  /** Сундуки и их содержимое (RF-9.1). */
  chest: z.object({
    common: caption,
    rich: caption,
    precious: caption,
    wordCard: caption,
    scroll: caption,
    crystals: caption,
    duplicates: caption,
  }),
  /** Подсказка на экране упражнения: что делать. */
  exercise: z.object({
    listenPick: captions(),
    sayBack: captions(),
    echoSound: captions(),
    buildPhrase: captions(),
    quickMatch: captions(),
    gardenWater: captions(),
    readFreeze: captions(),
  }),
  /** Реакция движка на ответ ребёнка. */
  feedback: z.object({
    correct: caption,
    almost: caption,
    shown: caption,
  }),
  /** Экран сессии и конец дня (RF-3.1, RF-3.5). */
  session: z.object({
    intro: caption,
    cliffhangerPrompt: caption,
    dayClosedTitle: caption,
    dayClosedBody: caption,
    restHint: caption,
    continueLabel: caption,
  }),
  /** Карта и сад. */
  map: z.object({
    underSilence: caption,
    open: caption,
  }),
  garden: z.object({
    empty: caption,
    due: caption,
  }),
});

export type Labels = z.infer<typeof labelsSchema>;
export type ExerciseLabels = Labels["exercise"];
export type ExerciseKind = keyof ExerciseLabels;

/** Ключ оценки совпадает с ключом подписи — проверяем это одной схемой. */
export const srsGradeLabelKeys = srsGradeSchema.options;
