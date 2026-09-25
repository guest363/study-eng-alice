/**
 * listen-pick — «услышала слово, выбери картинку» (task.md RF-4.2).
 * Логика без UI: собрать варианты и проверить ответ.
 */
import type { Exercise, Word } from "../contracts";

export type ListenPickOption = Readonly<{
  wordId: string;
  /** Что показывать на карточке: картинка, эмодзи или само слово. */
  label: string;
  isEmoji: boolean;
  correct: boolean;
}>;

/**
 * Варианты в порядке контента: правильный ответ идёт по порядку exercise.distractorIds,
 * перемешивание — дело UI (иначе картинка всегда на первом месте).
 */
export const buildListenPickOptions = (
  exercise: Extract<Exercise, { type: "listen-pick" }>,
  wordsById: ReadonlyMap<string, Word>,
): ListenPickOption[] => {
  const ids = [exercise.wordId, ...exercise.distractorIds];
  return ids.map((wordId) => {
    const word = wordsById.get(wordId);
    const emoji = word?.emoji;
    return {
      wordId,
      label: emoji ?? word?.en ?? wordId,
      isEmoji: Boolean(emoji),
      correct: wordId === exercise.wordId,
    };
  });
};

export const isListenPickCorrect = (
  exercise: Extract<Exercise, { type: "listen-pick" }>,
  answerWordId: string,
): boolean => answerWordId === exercise.wordId;
