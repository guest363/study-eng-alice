/**
 * @tw/core — чистый домен тренажёра: контракты Zod, FSRS-lite, сборщик сессий,
 * движок упражнений, реакции, ранги. Без React, DOM и браузерных API.
 */

export { ACCENT_IDS, type Accent, NEW_WORD_RATE, SLOW_RATE } from "./accents";
export * from "./contracts";
export {
  DAILY_SPARKS_CAP,
  ELEMENT_IDS,
  ELEMENTS,
  type ElementId,
  type ElementMeta,
  SPARKS_PER_TASK,
} from "./elements";
export * from "./events/bus";
export * from "./exercises/answers";
export * from "./exercises/build-phrase";
export * from "./exercises/garden-water";
export * from "./exercises/listen-pick";
export * from "./fsrs/fsrs-lite";
export { createRng, type Rng, seedFrom, shuffle } from "./random";
export * from "./reactions/reactions";
export * from "./session/exercise-engine";
export * from "./session/session-builder";
export * from "./xp";
