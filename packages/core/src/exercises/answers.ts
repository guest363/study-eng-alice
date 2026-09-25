/**
 * Единая проверка ответа по типу упражнения (task.md RF-4.1: у всех типов один контракт).
 * UI отвечает «значением ответа» — строкой (id слова, порядок блоков) или оценкой сада.
 */
import type { Exercise, SrsGrade, Word } from "../contracts";
import { isPhraseCorrect } from "./build-phrase";
import { isGardenGrade } from "./garden-water";
import { isListenPickCorrect } from "./listen-pick";

/** Ответ say-back и echo-sound: ребёнок нажал «Я сказал!» (RF-4.3). */
export const SAID_ANSWER = "said";

/** Что UI может прислать в движок. */
export type AnswerValue = string | readonly string[] | SrsGrade;

export type AnswerCheck = Readonly<{
  /** Упражнение считается решённым (в саду это всегда так). */
  resolved: boolean;
  correct: boolean;
  /** Оценка в сад, если тип упражнения её возвращает. */
  grade: SrsGrade | null;
}>;

const UNRESOLVED: AnswerCheck = { resolved: false, correct: false, grade: null };

/** Слова, которых касается упражнение: по ним движок считает прогресс и реакции. */
export const wordIdsOf = (exercise: Exercise): string[] => {
  switch (exercise.type) {
    case "listen-pick":
      return [exercise.wordId, ...exercise.distractorIds];
    case "quick-match":
    case "garden-water":
      return [...exercise.wordIds];
    default:
      return [exercise.wordId];
  }
};

/**
 * Слова, которые упражнение реально учит: цель для одиночных упражнений, весь набор
 * для пар и сада. Отличается от wordIdsOf: distractors ребёнок слышит, но не учит,
 * поэтому в дневной бюджет новых слов (RF-5.3) они не входят.
 */
export const taughtWordIds = (exercise: Exercise): string[] => {
  switch (exercise.type) {
    case "quick-match":
    case "garden-water":
      return [...exercise.wordIds];
    default:
      return [exercise.wordId];
  }
};

/** Слово, вокруг которого упражнение (для подсказок, сада и реакций). */
export const targetWordId = (exercise: Exercise): string =>
  "wordId" in exercise ? exercise.wordId : (exercise.wordIds[0] ?? "");

const checkOne = (
  exercise: Exercise,
  answer: AnswerValue,
  wordsById: ReadonlyMap<string, Word>,
): AnswerCheck => {
  switch (exercise.type) {
    case "listen-pick":
      return typeof answer === "string"
        ? { resolved: true, correct: isListenPickCorrect(exercise, answer), grade: null }
        : UNRESOLVED;
    case "say-back":
    case "echo-sound":
      // Ребёнок нажал «Я сказал!»: оценивать произношение нечем, и не нужно (RF-4.3, RF-4.9).
      return answer === SAID_ANSWER ? { resolved: true, correct: true, grade: null } : UNRESOLVED;
    case "build-phrase": {
      const word = wordsById.get(exercise.wordId);
      if (!word || typeof answer === "string" || !Array.isArray(answer)) {
        return UNRESOLVED;
      }
      const correct = isPhraseCorrect(word, answer);
      return { resolved: true, correct, grade: null };
    }
    case "quick-match":
      // UI присылает id слов в порядке показанных картинок; верно — исходный порядок.
      if (typeof answer !== "string" || !isPairedCorrect(exercise.wordIds, answer)) {
        return UNRESOLVED;
      }
      return { resolved: true, correct: true, grade: null };
    case "garden-water":
      return isGardenGrade(answer) ? { resolved: true, correct: true, grade: answer } : UNRESOLVED;
    case "read-freeze": {
      if (exercise.mode === "pick") {
        return typeof answer === "string"
          ? { resolved: true, correct: answer === exercise.wordId, grade: null }
          : UNRESOLVED;
      }
      const word = wordsById.get(exercise.wordId);
      if (!word || typeof answer === "string" || !Array.isArray(answer)) {
        return UNRESOLVED;
      }
      const correct = word.en.toLowerCase() === answer.join("").toLowerCase();
      return { resolved: true, correct, grade: null };
    }
  }
};

const isPairedCorrect = (wordIds: readonly string[], answer: string): boolean => {
  const given = answer.split(",").filter((part) => part.length > 0);
  return given.length === wordIds.length && given.every((id, index) => id === wordIds[index]);
};

/** Проверка ответа по типу упражнения. */
export const checkAnswer = (
  exercise: Exercise,
  answer: AnswerValue,
  wordsById: ReadonlyMap<string, Word> = new Map(),
): AnswerCheck => checkOne(exercise, answer, wordsById);
