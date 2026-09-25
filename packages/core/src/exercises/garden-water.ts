/**
 * garden-water — «полей слово в саду» (task.md RF-4.7, RF-5.1).
 * Здесь нет неправильного ответа: ребёнок честно говорит, вспомнила или нет.
 * Поэтому упражнение всегда «решается» и всегда возвращает оценку в сад.
 */
import type { SrsGrade, WordState } from "../contracts";
import { isDue } from "../fsrs/fsrs-lite";

/** Сколько карточек максимум в одном поливе (контракт упражнения — 1…8). */
export const GARDEN_BATCH_MAX = 8;

/** Слова, которым «хочется пить»: срок наступил, защита звездой памяти не отменяет срока. */
export const dueWordStates = (
  states: readonly WordState[],
  nowMs: number,
  limit = GARDEN_BATCH_MAX,
): WordState[] =>
  states
    .filter((state) => isDue(state, nowMs))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.wordId.localeCompare(b.wordId))
    .slice(0, limit);

/** Оценки кнопок сада: угадано всегда, различается только темп повторения. */
export const isGardenGrade = (answer: unknown): answer is SrsGrade =>
  answer === "remembered" || answer === "hinted" || answer === "forgotten";
