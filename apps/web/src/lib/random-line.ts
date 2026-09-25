/**
 * Выбор реплики из банка: детерминированно по ключу, чтобы за один день Паймон
 * не повторялась и за сессию реплики не «прыгали» при перерисовке.
 */
import { createRng, seedFrom } from "@tw/core";

export const pickLine = (lines: readonly string[], seed: string): string => {
  if (lines.length === 0) {
    return "";
  }
  const rng = createRng(seedFrom(seed));
  const index = Math.floor(rng() * lines.length);
  return lines[Math.min(index, lines.length - 1)] ?? "";
};
