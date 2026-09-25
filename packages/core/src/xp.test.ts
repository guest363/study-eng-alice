/**
 * Тесты опыта и ранга Хранителя (task.md §4.5): ранг растёт только от слов и квестов,
 * сравнения с другими игроками в домене нет и быть не может.
 */
import { describe, expect, it } from "vitest";
import {
  MAX_RANK,
  RANK_THRESHOLDS,
  rankByXp,
  XP_PER_CHEST,
  XP_PER_EXERCISE,
  XP_PER_REVIEW,
  XP_PER_SHOWN,
  XP_PER_TASK,
  xpToNextRank,
} from "./xp";

describe("опыт и ранг", () => {
  it("ранг растёт по порогам и не выше потолка", () => {
    expect(rankByXp(0)).toBe(1);
    expect(rankByXp(39)).toBe(1);
    expect(rankByXp(40)).toBe(2);
    expect(rankByXp(1200)).toBe(MAX_RANK);
    expect(rankByXp(99_999)).toBe(MAX_RANK);
  });

  it("пороги растущие — иначе ранг может откатиться назад", () => {
    const sorted = [...RANK_THRESHOLDS].sort((a, b) => a - b);
    expect(sorted).toEqual([...RANK_THRESHOLDS]);
  });

  it("до следующего ранга считается остаток опыта", () => {
    expect(xpToNextRank(0)).toBe(RANK_THRESHOLDS[1]);
    expect(xpToNextRank(30)).toBe(10);
    expect(xpToNextRank(1200)).toBe(0);
  });

  it("награды за сундуки растут вместе с сундуком", () => {
    expect(XP_PER_CHEST.common).toBeLessThan(XP_PER_CHEST.rich);
    expect(XP_PER_CHEST.rich).toBeLessThan(XP_PER_CHEST.precious);
  });

  it("показанный ответ даёт меньше опыта, чем решённый, но не ноль", () => {
    expect(XP_PER_SHOWN).toBeGreaterThan(0);
    expect(XP_PER_SHOWN).toBeLessThan(XP_PER_EXERCISE);
  });

  it("повторение в саду дешевле нового упражнения", () => {
    expect(XP_PER_REVIEW).toBeLessThan(XP_PER_EXERCISE);
  });

  it("за поручение даётся больше, чем за одно упражнение", () => {
    expect(XP_PER_TASK).toBeGreaterThan(XP_PER_EXERCISE);
  });
});
