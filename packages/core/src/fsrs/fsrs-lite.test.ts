/**
 * Тесты FSRS-lite. Сценарии взяты из приёмки G2 (task.md §10): интервалы совпадают
 * с таблицей, «живое» слово — ровно после третьего успешного повторения, а
 * пропущенные дни не ломают прогресс.
 */
import { describe, expect, it } from "vitest";
import type { SrsGrade, WordState } from "../contracts";
import {
  clearExpiredStar,
  createWordState,
  extendInterval,
  intervalIndex,
  isDue,
  LIVE_AFTER_SUCCESSFUL_REPS,
  plantStage,
  protectWithStar,
  reviewWord,
  SRS_INTERVALS,
  STAR_PROTECTION_DAYS,
} from "./fsrs-lite";

const DAY = 24 * 60 * 60 * 1000;
const start = Date.UTC(2026, 8, 25, 9, 0, 0);

const daysUntil = (iso: string, fromMs: number) =>
  Math.round((new Date(iso).getTime() - fromMs) / DAY);

const play = (state: WordState, grades: readonly SrsGrade[], stepDays = 1): WordState => {
  let now = start;
  let current = state;
  for (const grade of grades) {
    now += stepDays * DAY;
    current = reviewWord(current, grade, now);
  }
  return current;
};

describe("FSRS-lite: создание слова", () => {
  it("новое слово ждёт полива в тот же день и не является живым", () => {
    const state = createWordState("mnd-sound-book", start);
    expect(state.stability).toBe(0);
    expect(state.difficulty).toBe(3);
    expect(state.reps).toBe(0);
    expect(state.live).toBe(false);
    expect(state.starProtectedUntil).toBeNull();
    expect(isDue(state, start)).toBe(true);
  });

  it("прогоняет состояние через контракт Zod", () => {
    expect(() => createWordState("", start)).toThrow();
  });
});

describe("FSRS-lite: интервалы", () => {
  it("первое успешное повторение даёт 1 день", () => {
    const state = play(createWordState("w", start), ["remembered"]);
    expect(state.stability).toBe(1);
    expect(daysUntil(state.dueAt, start + DAY)).toBe(1);
  });

  it("слово средней трудности идёт по лестнице 1 → 3 → 7 → 14 → 30", () => {
    const state = play(createWordState("w", start), [
      "hinted",
      "remembered",
      "hinted",
      "remembered",
      "hinted",
    ]);
    expect(state.stability).toBe(30);
    expect(intervalIndex(state.stability)).toBe(SRS_INTERVALS.length - 1);
  });

  it("каждое выданное повторение берёт интервал только из таблицы", () => {
    const grades: SrsGrade[] = ["remembered", "hinted", "forgotten", "remembered", "remembered"];
    let state = createWordState("w", start);
    const seen: number[] = [];
    grades.forEach((grade, index) => {
      state = reviewWord(state, grade, start + (index + 1) * DAY);
      seen.push(state.stability);
    });
    for (const stability of seen) {
      expect(SRS_INTERVALS as readonly number[]).toContain(stability);
    }
  });

  it("слово, которое трижды подряд далось легко, растёт сразу на два шага", () => {
    const state = play(createWordState("w", start), ["remembered", "remembered", "remembered"]);
    expect(state.difficulty).toBe(1);
    expect(state.stability).toBe(14);
  });

  it("интервал не выходит за пределы лестницы", () => {
    const state = play(createWordState("w", start), [
      "remembered",
      "remembered",
      "remembered",
      "remembered",
      "remembered",
    ]);
    expect(state.stability).toBe(30);
  });
});

describe("FSRS-lite: оценки", () => {
  it("«не вспомнила» возвращает слово на завтра и считает забывание", () => {
    const state = play(createWordState("w", start), ["remembered", "remembered", "forgotten"]);
    expect(state.stability).toBe(1);
    expect(state.lapses).toBe(1);
    expect(state.successfulReps).toBe(2);
    expect(state.live).toBe(false);
    expect(state.difficulty).toBe(2);
  });

  it("«подскажи» двигает интервал, но повышает трудность", () => {
    const hinted = play(createWordState("w", start), ["hinted"]);
    const remembered = play(createWordState("w", start), ["remembered"]);
    expect(hinted.stability).toBe(remembered.stability);
    expect(hinted.difficulty).toBe(4);
    expect(remembered.difficulty).toBe(2);
  });

  it("трудность не выходит за 1…5", () => {
    const easy = play(
      createWordState("w", start),
      Array.from({ length: 12 }, () => "remembered" as const),
    );
    const hard = play(
      createWordState("w", start),
      Array.from({ length: 12 }, () => "hinted" as const),
    );
    expect(easy.difficulty).toBe(1);
    expect(hard.difficulty).toBe(5);
  });

  it("счётчики повторений растут на каждом шаге", () => {
    const state = play(createWordState("w", start), ["remembered", "hinted", "remembered"]);
    expect(state.reps).toBe(3);
    expect(state.successfulReps).toBe(3);
    expect(state.lapses).toBe(0);
  });
});

describe("FSRS-lite: живое слово", () => {
  it("становится живым ровно после третьего успешного повторения", () => {
    const afterTwo = play(createWordState("w", start), ["remembered", "remembered"]);
    expect(afterTwo.live).toBe(false);
    const afterThree = play(createWordState("w", start), [
      "remembered",
      "remembered",
      "remembered",
    ]);
    expect(afterThree.successfulReps).toBe(LIVE_AFTER_SUCCESSFUL_REPS);
    expect(afterThree.live).toBe(true);
  });

  it("живым словом остаётся даже после забывания", () => {
    const state = play(createWordState("w", start), [
      "remembered",
      "remembered",
      "remembered",
      "forgotten",
    ]);
    expect(state.live).toBe(true);
  });

  it("стадия растения идёт росток → бутон → цветок", () => {
    const fresh = createWordState("w", start);
    const once = play(fresh, ["remembered"]);
    const three = play(fresh, ["remembered", "remembered", "remembered"]);
    expect(plantStage(fresh)).toBe("sprout");
    expect(plantStage(once)).toBe("bud");
    expect(plantStage(three)).toBe("flower");
  });
});

describe("FSRS-lite: пропущенные дни", () => {
  const grades = ["remembered", "hinted", "hinted", "remembered"] as const;

  it("пять пропущенных дней ничего не ломают: результат тот же, что и при ежедневных повторениях", () => {
    const daily = play(createWordState("w", start), grades, 1);
    const withGaps = play(createWordState("w", start), grades, 6);
    expect(withGaps.stability).toBe(daily.stability);
    expect(withGaps.difficulty).toBe(daily.difficulty);
    expect(withGaps.lapses).toBe(daily.lapses);
    expect(withGaps.live).toBe(daily.live);
  });

  it("лестница при ежедневных повторениях — 1, 3, 7, 14", () => {
    const seen: number[] = [];
    let state = createWordState("w", start);
    grades.forEach((grade, index) => {
      state = reviewWord(state, grade, start + (index + 1) * DAY);
      seen.push(state.stability);
    });
    expect(seen).toEqual([1, 3, 7, 14]);
  });

  it("просроченное слово остаётся в саду и ждёт полива", () => {
    const state = play(createWordState("w", start), ["remembered"], 1);
    expect(isDue(state, start + 1 * DAY)).toBe(false);
    expect(isDue(state, start + 2 * DAY)).toBe(true);
  });
});

describe("FSRS-lite: звезда памяти", () => {
  it("звезда памяти отодвигает срок на 7 дней", () => {
    const base = play(createWordState("w", start), ["remembered"]);
    const protectedState = protectWithStar(base, start + 2 * DAY);
    expect(daysUntil(base.dueAt, start + 2 * DAY)).toBe(0);
    expect(daysUntil(protectedState.dueAt, start + 2 * DAY)).toBe(STAR_PROTECTION_DAYS);
    expect(protectedState.starProtectedUntil).toBe(protectedState.dueAt);
  });

  it("звезда памяти не отменяет полив, а только откладывает его", () => {
    const base = play(createWordState("w", start), ["remembered"]);
    const protectedState = protectWithStar(base, start + 2 * DAY);
    expect(isDue(protectedState, start + 8 * DAY)).toBe(false);
    expect(isDue(protectedState, start + 9 * DAY)).toBe(true);
  });

  it("истёкшая защита снимается, чтобы сад снова напомнил о слове", () => {
    const base = play(createWordState("w", start), ["remembered"]);
    const protectedState = protectWithStar(base, start + 2 * DAY);
    expect(clearExpiredStar(protectedState, start + 2 * DAY).starProtectedUntil).not.toBeNull();
    expect(clearExpiredStar(protectedState, start + 30 * DAY).starProtectedUntil).toBeNull();
    expect(clearExpiredStar(base, start + 2 * DAY).starProtectedUntil).toBeNull();
  });

  it("забывание снимает защиту — ребёнок снова встречает слово в саду", () => {
    const base = protectWithStar(play(createWordState("w", start), ["remembered"]), start);
    const afterLapse = play(base, ["forgotten"]);
    expect(afterLapse.starProtectedUntil).toBeNull();
  });

  it("реакция Бутонизация сдвигает срок на день", () => {
    const base = play(createWordState("w", start), ["remembered"]);
    const extended = extendInterval(base);
    expect(daysUntil(extended.dueAt, start + DAY)).toBe(2);
  });
});
