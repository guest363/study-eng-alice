/**
 * Тесты параметров озвучки (task.md RF-10.1, RF-4.4): темпы зафиксированы требованиями,
 * чтобы ребёнок всегда слышал одинаково спокойное произношение.
 */
import { describe, expect, it } from "vitest";
import { ACCENT_IDS, NEW_WORD_RATE, SLOW_RATE } from "./accents";

describe("озвучка: темпы и акценты", () => {
  it("новые слова звучат замедленно", () => {
    expect(NEW_WORD_RATE).toBe(0.85);
  });

  it("задание на произношение идёт в темпе 0.7", () => {
    expect(SLOW_RATE).toBe(0.7);
    expect(SLOW_RATE).toBeLessThan(NEW_WORD_RATE);
  });

  it("доступны ровно два акцента: en-US и en-GB", () => {
    expect([...ACCENT_IDS]).toEqual(["us", "uk"]);
  });
});
