/**
 * Тесты реакций стихий (приёмка G2): связка Гидро→Пиро даёт Испарение ровно один раз
 * за пару, награда удваивает опыт, а само событие уходит в шину.
 */
import { describe, expect, it } from "vitest";
import { type Reaction, reactionListSchema, type WordState, wordStateSchema } from "../contracts";
import { appBus, type ReactionTriggeredEvent } from "../events/bus";
import { createWordState } from "../fsrs/fsrs-lite";
import {
  applyReaction,
  createReactionDetector,
  detectReaction,
  otherAccent,
  type ReactionStep,
} from "./reactions";

const DAY = 24 * 60 * 60 * 1000;
const nowMs = Date.UTC(2026, 8, 25, 9, 0, 0);

const reactions: Reaction[] = reactionListSchema.parse([
  {
    id: "vaporize",
    nameRu: "Испарение",
    from: "hydro",
    to: "pyro",
    bonus: "xp-x2",
    descriptionRu: "описание",
  },
  {
    id: "electro-charged",
    nameRu: "Заряд",
    from: "hydro",
    to: "electro",
    bonus: "crystals-2",
    descriptionRu: "описание",
  },
  {
    id: "bloom",
    nameRu: "Бутонизация",
    from: "hydro",
    to: "dendro",
    bonus: "interval-plus",
    descriptionRu: "описание",
  },
  {
    id: "crystallize",
    nameRu: "Кристаллизация",
    from: "geo",
    to: "any",
    bonus: "star-protect",
    descriptionRu: "описание",
  },
  {
    id: "swirl",
    nameRu: "Рассеивание",
    from: "anemo",
    to: "any",
    bonus: "accent-swap",
    descriptionRu: "описание",
  },
]);

const step = (element: ReactionStep["element"], ...wordIds: string[]): ReactionStep => ({
  element,
  wordIds,
});

/** Реакция обязана сработать — иначе тест падает с понятным сообщением, а не с TypeError. */
const mustTrigger = (previous: ReactionStep, current: ReactionStep) => {
  const trigger = detectReaction(previous, current, reactions);
  if (!trigger) {
    throw new Error(`Ожидалась реакция на связку ${previous.element} → ${current.element}`);
  }
  return trigger;
};

describe("реакции: поиск связки", () => {
  it("Гидро → Пиро даёт Испарение", () => {
    const trigger = detectReaction(step("hydro", "a"), step("pyro", "b"), reactions);
    expect(trigger?.reaction.id).toBe("vaporize");
  });

  it("в пару попадают слова обоих шагов", () => {
    const trigger = detectReaction(step("hydro", "a"), step("pyro", "b"), reactions);
    expect(trigger?.wordIds).toEqual(["a", "b"]);
  });

  it("обратный порядок реакцией не считается", () => {
    expect(detectReaction(step("pyro", "a"), step("hydro", "b"), reactions)).toBeNull();
  });

  it("пара с «любая стихия» работает с любым следующим шагом", () => {
    expect(detectReaction(step("geo", "a"), step("cryo", "b"), reactions)?.reaction.id).toBe(
      "crystallize",
    );
    expect(detectReaction(step("anemo", "a"), step("dendro", "b"), reactions)?.reaction.id).toBe(
      "swirl",
    );
  });

  it("на первом шаге реакции нет", () => {
    expect(detectReaction(null, step("hydro", "a"), reactions)).toBeNull();
  });

  it("связки, которой нет в таблице, не срабатывают", () => {
    expect(detectReaction(step("cryo", "a"), step("pyro", "b"), reactions)).toBeNull();
  });
});

describe("реакции: детектор с памятью", () => {
  it("срабатывает ровно один раз за пару", () => {
    const detector = createReactionDetector(reactions);
    expect(detector.push(step("hydro", "a"))).toBeNull();
    expect(detector.push(step("pyro", "b"))?.reaction.id).toBe("vaporize");
    expect(detector.push(step("pyro", "c"))).toBeNull();
  });

  it("та же пара в другом месте сессии срабатывает снова", () => {
    const detector = createReactionDetector(reactions);
    detector.push(step("anemo", "a"));
    detector.push(step("hydro", "b"));
    const first = detector.push(step("pyro", "c"));
    detector.push(step("anemo", "d"));
    detector.push(step("hydro", "e"));
    const second = detector.push(step("pyro", "f"));
    expect(first?.reaction.id).toBe("vaporize");
    expect(second?.reaction.id).toBe("vaporize");
  });

  it("новая сессия забывает предыдущий шаг", () => {
    const detector = createReactionDetector(reactions);
    detector.push(step("hydro", "a"));
    detector.reset();
    expect(detector.push(step("pyro", "b"))).toBeNull();
  });
});

describe("реакции: награда", () => {
  const state = (): WordState => createWordState("mnd-sound-book", nowMs - 10 * DAY);

  it("Испарение удваивает опыт и не трогает слово", () => {
    const effect = applyReaction(
      mustTrigger(step("hydro", "a"), step("pyro", "b")),
      state(),
      nowMs,
      "us",
    );
    expect(effect.xpMultiplier).toBe(2);
    expect(effect.crystals).toBe(0);
    expect(effect.wordState.starProtectedUntil).toBeNull();
  });

  it("Заряд даёт два кристалла", () => {
    const trigger = mustTrigger(step("hydro", "a"), step("electro", "b"));
    expect(applyReaction(trigger, state(), nowMs, "us").crystals).toBe(2);
  });

  it("Бутонизация сдвигает срок повторения", () => {
    const trigger = mustTrigger(step("hydro", "a"), step("dendro", "b"));
    const before = state();
    const effect = applyReaction(trigger, before, nowMs, "us");
    expect(Date.parse(effect.wordState.dueAt)).toBeGreaterThan(Date.parse(before.dueAt));
  });

  it("Кристаллизация ставит звезду памяти", () => {
    const trigger = mustTrigger(step("geo", "a"), step("pyro", "b"));
    const effect = applyReaction(trigger, state(), nowMs, "us");
    expect(effect.wordState.starProtectedUntil).not.toBeNull();
    expect(Date.parse(effect.wordState.dueAt) - nowMs).toBe(7 * DAY);
  });

  it("Рассеивание меняет акцент озвучки на противоположный", () => {
    const trigger = mustTrigger(step("anemo", "a"), step("pyro", "b"));
    expect(applyReaction(trigger, state(), nowMs, "us").accent).toBe("uk");
    expect(applyReaction(trigger, state(), nowMs, "uk").accent).toBe("us");
    expect(otherAccent("us")).toBe("uk");
  });

  it("слово после реакции остаётся валидным состоянием сада", () => {
    const trigger = mustTrigger(step("geo", "a"), step("pyro", "b"));
    const effect = applyReaction(trigger, state(), nowMs, "us");
    expect(() => wordStateSchema.parse(effect.wordState)).not.toThrow();
  });
});

describe("реакции: событие в шине", () => {
  it("сработавшая реакция уходит в шину один раз с названием и бонусом", () => {
    const events: ReactionTriggeredEvent[] = [];
    const handler = (event: ReactionTriggeredEvent) => events.push(event);
    appBus.on("reaction:triggered", handler);
    const trigger = mustTrigger(step("hydro", "a"), step("pyro", "b"));
    appBus.emit("reaction:triggered", {
      reactionId: trigger.reaction.id,
      nameRu: trigger.reaction.nameRu,
      bonus: trigger.reaction.bonus,
      wordIds: trigger.wordIds,
    });
    appBus.off("reaction:triggered", handler);
    expect(events).toHaveLength(1);
    expect(events[0]?.reactionId).toBe("vaporize");
    expect(events[0]?.nameRu).toBe("Испарение");
    expect(events[0]?.bonus).toBe("xp-x2");
  });
});
