/**
 * Движок упражнений: порядок, подсказки и «почти» (task.md RF-3.2, RF-4.1).
 *
 * Правила, которые нельзя нарушать:
 * — неправильный ответ не завершает упражнение: ребёнок получает подсказку (максимум 2);
 * — после второй подсказки движок показывает ответ и отправляет слово в сад на завтра;
 * — упражнение всегда заканчивается успехом, ошибка не штрафуется.
 *
 * Модуль чистый: вход — упражнения и ответ, выход — новое состояние прогона.
 */
import type { Exercise, SrsGrade, Word } from "../contracts";
import {
  type AnswerCheck,
  type AnswerValue,
  checkAnswer,
  SAID_ANSWER,
  targetWordId,
  wordIdsOf,
} from "../exercises/answers";
import { isGardenGrade } from "../exercises/garden-water";
import { XP_PER_EXERCISE, XP_PER_REVIEW, XP_PER_SHOWN } from "../xp";

/** Больше двух подсказок не бывает (RF-3.2). */
export const MAX_HINTS = 2;

/** Итог одного упражнения. */
export type ItemResult = Readonly<{
  grade: SrsGrade;
  hintsUsed: number;
  /** Ответ был показан — ребёнок не догадался сам, слово ждёт сад. */
  answerShown: boolean;
  goToGarden: string[];
}>;

export type ExerciseRun = Readonly<{
  items: readonly Exercise[];
  index: number;
  /** id упражнения в квесте: "<questId>#<step>#<item>". */
  idPrefix: string;
  status: "asking" | "resolved";
  hintsUsed: number;
  answerShown: boolean;
  results: readonly (ItemResult | null)[];
  /** Все слова, которых коснулись упражнения блока. */
  touchedWordIds: readonly string[];
}>;

export type RunSummary = Readonly<{
  done: number;
  total: number;
  hintsUsed: number;
  xp: number;
  /** Слова, отправленные в сад из-за двух подсказок. */
  goToGarden: string[];
  grades: readonly SrsGrade[];
}>;

/** Старт прогона: первое упражнение блока, ничего не решено. */
export const createExerciseRun = (items: readonly Exercise[], idPrefix: string): ExerciseRun => {
  if (items.length === 0) {
    throw new Error("Блок упражнений пуст — движку нечего запускать");
  }
  return {
    items,
    index: 0,
    idPrefix,
    status: "asking",
    hintsUsed: 0,
    answerShown: false,
    results: items.map(() => null),
    touchedWordIds: [...new Set(items.flatMap(wordIdsOf))],
  };
};

export const isRunFinished = (run: ExerciseRun): boolean => run.index >= run.items.length;

const resolve = (run: ExerciseRun, result: ItemResult): ExerciseRun => {
  const results = [...run.results];
  results[run.index] = result;
  return {
    ...run,
    status: "resolved",
    hintsUsed: result.hintsUsed,
    answerShown: result.answerShown,
    results,
  };
};

/**
 * Ответ ребёнка. Возвращает новое состояние — мутировать ничего нельзя: состояние
 * сессии лежит в IndexedDB и должно переживать перезагрузку страницы (RF-3.4).
 */
export const submitAnswer = (
  run: ExerciseRun,
  answer: AnswerValue,
  wordsById: ReadonlyMap<string, Word> = new Map(),
): ExerciseRun => {
  if (run.status === "resolved") {
    return run;
  }
  const exercise = run.items[run.index];
  if (!exercise) {
    return run;
  }
  const check: AnswerCheck = checkAnswer(exercise, answer, wordsById);
  if (!check.resolved) {
    return run;
  }

  // В саду ответ всегда верный: ребёнка не оценивают, она честно сказала, вспомнила или нет.
  if (exercise.type === "garden-water" && isGardenGrade(answer)) {
    return resolve(run, {
      grade: answer,
      hintsUsed: run.hintsUsed,
      answerShown: false,
      goToGarden: [],
    });
  }

  if (check.correct) {
    return resolve(run, {
      grade: "remembered",
      hintsUsed: run.hintsUsed,
      answerShown: false,
      goToGarden: [],
    });
  }

  const hintsUsed = run.hintsUsed + 1;
  if (hintsUsed < MAX_HINTS) {
    // Первая и вторая попытка — это «почти»: даём подсказку и пробуем снова.
    return { ...run, hintsUsed };
  }

  // Две подсказки кончились: показываем ответ, слово уходит в сад на повтор завтра.
  return resolve(run, {
    grade: "hinted",
    hintsUsed,
    answerShown: true,
    goToGarden: [targetWordId(exercise)],
  });
};

/** Кнопка «Я сказал!» — ответ без оценки произношения (RF-4.3). */
export const submitSaid = (run: ExerciseRun): ExerciseRun => submitAnswer(run, SAID_ANSWER);

/** Наставник показывает ответ сам — упражнение закрывается тепло (RF-3.2). */
export const showAnswer = (run: ExerciseRun): ExerciseRun => {
  if (run.status === "resolved") {
    return run;
  }
  const exercise = run.items[run.index];
  if (!exercise) {
    return run;
  }
  return resolve(run, {
    grade: "hinted",
    hintsUsed: run.hintsUsed,
    answerShown: true,
    goToGarden: [targetWordId(exercise)],
  });
};

/** Переход к следующему упражнению блока. */
export const nextExercise = (run: ExerciseRun): ExerciseRun => {
  if (run.status !== "resolved") {
    return run;
  }
  return { ...run, index: run.index + 1, status: "asking", hintsUsed: 0, answerShown: false };
};

export const gradesOf = (run: ExerciseRun): SrsGrade[] =>
  run.results.filter((result): result is ItemResult => result !== null).map((r) => r.grade);

/** Итог блока: опыт, подсказки и слова, которые нужно отдать в саду. */
export const summarizeRun = (run: ExerciseRun): RunSummary => {
  const done = run.results.filter((result): result is ItemResult => result !== null);
  const goToGarden = done.flatMap((result) => result.goToGarden);
  const hintsUsed = done.reduce((sum, result) => sum + result.hintsUsed, 0);
  const xp = run.items.reduce((sum, item, index) => {
    const result = run.results[index];
    if (!result) {
      return sum;
    }
    if (result.answerShown) {
      return sum + XP_PER_SHOWN;
    }
    return sum + (item.type === "garden-water" ? XP_PER_REVIEW : XP_PER_EXERCISE);
  }, 0);
  return {
    done: done.length,
    total: run.items.length,
    hintsUsed,
    xp,
    goToGarden,
    grades: gradesOf(run),
  };
};
