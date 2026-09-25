/**
 * Реакции стихий — детерминированные комбо двух упражнений подряд (task.md RF-7).
 *
 * Правила: никакого рандома и никаких «шансов». Сработала связка — значит награда
 * выдаётся ровно один раз за эту пару и попадает в «Кодекс реакций».
 */

import type { Accent } from "../accents";
import type { Reaction, WordState } from "../contracts";
import { extendInterval, protectWithStar } from "../fsrs/fsrs-lite";

/** Шаг сессии, который может вызвать реакцию. */
export type ReactionStep = Readonly<{
  element: Reaction["from"];
  wordIds: readonly string[];
}>;

export type ReactionTrigger = Readonly<{
  reaction: Reaction;
  /** Слова пары: из предыдущего и текущего шага. */
  wordIds: readonly string[];
}>;

export const otherAccent = (accent: Accent): Accent => (accent === "us" ? "uk" : "us");

/**
 * Сработала ли реакция на стыке шагов. Ищем по таблице контента: совпадение пары
 * «предыдущая стихия → текущая», реакция с `to: "any"` подходит к любой следующей.
 */
export const detectReaction = (
  previous: ReactionStep | null,
  current: ReactionStep,
  reactions: readonly Reaction[],
): ReactionTrigger | null => {
  if (!previous) {
    return null;
  }
  const reaction = reactions.find(
    (candidate) =>
      candidate.from === previous.element &&
      (candidate.to === "any" || candidate.to === current.element),
  );
  if (!reaction) {
    return null;
  }
  return { reaction, wordIds: [...previous.wordIds, ...current.wordIds] };
};

/**
 * Детектор с памятью: держит предыдущий шаг, чтобы вызывать его можно было
 * по одному шагу за раз, как это делает экран сессии.
 */
export const createReactionDetector = (reactions: readonly Reaction[]) => {
  let previous: ReactionStep | null = null;
  return {
    /** Возвращает реакцию, если связка сработала. */
    push(step: ReactionStep): ReactionTrigger | null {
      const trigger = detectReaction(previous, step, reactions);
      previous = step;
      return trigger;
    },
    /** Забыть предыдущий шаг — например, началась новая сессия. */
    reset(): void {
      previous = null;
    },
  };
};

export type ReactionEffect = Readonly<{
  /** Множитель опыта за пару: 2 у Испарения, 1 у остальных. */
  xpMultiplier: number;
  crystals: number;
  /** Состояние слова после бонуса (звезда памяти или сдвиг интервала). */
  wordState: WordState;
  /** Акцент озвучки после бонуса: Рассеивание меняет голос на другой. */
  accent: Accent;
}>;

/** Применение награды реакции к слову, опыту, кристаллам и акценту. */
export const applyReaction = (
  trigger: ReactionTrigger,
  wordState: WordState,
  nowMs: number,
  accent: Accent,
): ReactionEffect => {
  const { bonus } = trigger.reaction;
  return {
    xpMultiplier: bonus === "xp-x2" ? 2 : 1,
    crystals: bonus === "crystals-2" ? 2 : 0,
    wordState:
      bonus === "star-protect"
        ? protectWithStar(wordState, nowMs)
        : bonus === "interval-plus"
          ? extendInterval(wordState, 1)
          : wordState,
    accent: bonus === "accent-swap" ? otherAccent(accent) : accent,
  };
};
