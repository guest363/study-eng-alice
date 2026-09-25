/**
 * Тесты движка упражнений. Главное из приёмки G2: две подсказки — и показ ответа,
 * после которого слово уходит в сад; упражнение всегда заканчивается успехом.
 */
import { describe, expect, it } from "vitest";
import type { Exercise, Word } from "../contracts";
import { wordSchema } from "../contracts";
import {
  createExerciseRun,
  gradesOf,
  isRunFinished,
  MAX_HINTS,
  nextExercise,
  showAnswer,
  submitAnswer,
  submitSaid,
  summarizeRun,
} from "./exercise-engine";

const book = wordSchema.parse({
  id: "mnd-sound-book",
  en: "book",
  ru: "книга",
  regionId: "mondstadt",
  theme: "sounds",
  partOfSpeech: "noun",
  emoji: "📕",
});

const apple = wordSchema.parse({
  id: "mnd-sound-apple",
  en: "apple",
  ru: "яблоко",
  regionId: "mondstadt",
  theme: "sounds",
  partOfSpeech: "noun",
  emoji: "🍎",
});

const thankYou = wordSchema.parse({
  id: "mnd-greet-thankyou",
  en: "thank you",
  ru: "спасибо",
  regionId: "mondstadt",
  theme: "greetings",
  partOfSpeech: "phrase",
});

const wordsById = new Map<string, Word>([
  [book.id, book],
  [apple.id, apple],
  [thankYou.id, thankYou],
]);

const listenPick: Exercise = {
  type: "listen-pick",
  wordId: book.id,
  distractorIds: [apple.id],
};

const buildPhrase: Exercise = { type: "build-phrase", wordId: thankYou.id };
const sayBack: Exercise = { type: "say-back", wordId: thankYou.id };
const garden: Exercise = { type: "garden-water", wordIds: [book.id, apple.id] };

describe("движок упражнений: правильный ответ", () => {
  it("завершает упражнение и запоминает слово", () => {
    const run = submitAnswer(createExerciseRun([listenPick], "mnd-q1#0"), book.id);
    expect(run.status).toBe("resolved");
    expect(gradesOf(run)).toEqual(["remembered"]);
    expect(run.results[0]?.goToGarden).toEqual([]);
  });

  it("ошибку в listen-pick не считает забыванием слова", () => {
    const run = submitAnswer(createExerciseRun([listenPick], "mnd-q1#0"), apple.id);
    expect(run.status).toBe("asking");
    expect(run.hintsUsed).toBe(1);
    expect(gradesOf(run)).toEqual([]);
  });

  it("«Я сказал!» закрывает say-back без оценки произношения", () => {
    const run = submitSaid(createExerciseRun([sayBack], "mnd-q1#1"));
    expect(run.status).toBe("resolved");
    expect(gradesOf(run)).toEqual(["remembered"]);
  });

  it("собранная фраза проверяется по порядку блоков", () => {
    const ok = submitAnswer(
      createExerciseRun([buildPhrase], "mnd-q1#2"),
      ["mnd-greet-thankyou-0", "mnd-greet-thankyou-1"],
      wordsById,
    );
    expect(ok.status).toBe("resolved");
    const bad = submitAnswer(
      createExerciseRun([buildPhrase], "mnd-q1#2"),
      ["mnd-greet-thankyou-1", "mnd-greet-thankyou-0"],
      wordsById,
    );
    expect(bad.status).toBe("asking");
  });

  it("в саду любой ответ — правильный, важна только оценка", () => {
    for (const grade of ["remembered", "hinted", "forgotten"] as const) {
      const run = submitAnswer(createExerciseRun([garden], "mnd-day#0"), grade);
      expect(run.status).toBe("resolved");
      expect(gradesOf(run)).toEqual([grade]);
    }
  });
});

describe("движок упражнений: подсказки", () => {
  it("после первой ошибки даёт подсказку, а не закрывает упражнение", () => {
    const run = submitAnswer(createExerciseRun([listenPick], "mnd-q1#0"), apple.id);
    expect(run.hintsUsed).toBe(1);
    expect(run.status).toBe("asking");
  });

  it("после двух подсказок показывает ответ и отправляет слово в сад", () => {
    let run = createExerciseRun([listenPick], "mnd-q1#0");
    run = submitAnswer(run, apple.id);
    run = submitAnswer(run, apple.id);
    expect(run.hintsUsed).toBe(MAX_HINTS);
    expect(run.answerShown).toBe(true);
    expect(run.status).toBe("resolved");
    expect(run.results[0]?.goToGarden).toEqual([book.id]);
  });

  it("больше двух подсказок не даётся: после показа ответа упражнение закрыто", () => {
    let run = createExerciseRun([listenPick], "mnd-q1#0");
    run = submitAnswer(run, apple.id);
    run = submitAnswer(run, apple.id);
    const afterShow = submitAnswer(run, book.id);
    expect(afterShow).toBe(run);
  });

  it("наставник может показать ответ сам — упражнение закрывается тепло", () => {
    const run = showAnswer(createExerciseRun([listenPick], "mnd-q1#0"));
    expect(run.status).toBe("resolved");
    expect(run.answerShown).toBe(true);
    expect(run.results[0]?.goToGarden).toEqual([book.id]);
    expect(gradesOf(run)).toEqual(["hinted"]);
  });

  it("ошибка не портит прогресс: после подсказки верный ответ засчитывается", () => {
    let run = createExerciseRun([listenPick], "mnd-q1#0");
    run = submitAnswer(run, apple.id);
    run = submitAnswer(run, book.id);
    expect(gradesOf(run)).toEqual(["remembered"]);
  });
});

describe("движок упражнений: порядок и итог", () => {
  it("идёт по упражнениям по порядку и завершается", () => {
    let run = createExerciseRun([listenPick, sayBack, garden], "mnd-q1#0");
    run = submitAnswer(run, book.id);
    run = nextExercise(run);
    expect(run.index).toBe(1);
    expect(run.status).toBe("asking");
    run = submitSaid(run);
    run = nextExercise(run);
    run = submitAnswer(run, "hinted");
    run = nextExercise(run);
    expect(isRunFinished(run)).toBe(true);
    expect(gradesOf(run)).toEqual(["remembered", "remembered", "hinted"]);
  });

  it("не перескакивает дальше нерешённого упражнения", () => {
    const run = createExerciseRun([listenPick, sayBack], "mnd-q1#0");
    expect(nextExercise(run)).toBe(run);
  });

  it("id упражнения содержит квест, шаг и номер", () => {
    let run = createExerciseRun([listenPick, sayBack], "mnd-q1#2");
    run = submitAnswer(run, book.id);
    expect(run.idPrefix).toBe("mnd-q1#2");
    run = nextExercise(run);
    expect(run.index).toBe(1);
  });

  it("итог считает опыт, подсказки и слова, ушедшие в сад", () => {
    let run = createExerciseRun([listenPick, garden], "mnd-q1#0");
    run = submitAnswer(run, apple.id);
    run = submitAnswer(run, apple.id);
    run = nextExercise(run);
    run = submitAnswer(run, "remembered");
    const summary = summarizeRun(run);
    expect(summary.done).toBe(2);
    expect(summary.total).toBe(2);
    expect(summary.hintsUsed).toBe(2);
    expect(summary.goToGarden).toEqual([book.id]);
    // 3 за показанный ответ + 2 за повторение в саду.
    expect(summary.xp).toBe(5);
  });

  it("собирает все слова, которых коснулись упражнения", () => {
    const run = createExerciseRun([listenPick, garden, buildPhrase], "mnd-q1#0");
    expect(run.touchedWordIds).toEqual([book.id, apple.id, thankYou.id]);
  });

  it("после конца блока ответы и подсказки больше ничего не меняют", () => {
    let run = createExerciseRun([listenPick], "mnd-q1#0");
    run = submitAnswer(run, book.id);
    run = nextExercise(run);
    expect(submitAnswer(run, book.id)).toBe(run);
    expect(showAnswer(run)).toBe(run);
    expect(submitSaid(run)).toBe(run);
  });

  it("пустой блок упражнений — ошибка разработчика, а не тихий пустой экран", () => {
    expect(() => createExerciseRun([], "mnd-q1#0")).toThrow(/пуст/);
  });

  it("неизвестный формат ответа игнорируется, состояние не меняется", () => {
    const run = createExerciseRun([listenPick], "mnd-q1#0");
    // Список приходит туда, где движок ждёт id слова, — такой ответ просто не засчитывается.
    expect(submitAnswer(run, ["book"])).toBe(run);
  });
});
