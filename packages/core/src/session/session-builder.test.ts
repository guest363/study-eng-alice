/**
 * Тесты сборщика дня. Проверяем приёмку G2: детерминирован при одной дате, новых слов
 * не больше четырёх, при пустом саде день всё равно собирается, при нуле искр день закрыт.
 */
import { describe, expect, it } from "vitest";
import { type Quest, questSchema, type Word, wordSchema } from "../contracts";
import { createWordState, reviewWord } from "../fsrs/fsrs-lite";
import {
  buildDayPlan,
  type DayPlanInput,
  dayIndex,
  dayKeyOf,
  elementOfDay,
  freshWords,
  MAX_NEW_WORDS_PER_DAY,
  TASKS_PER_DAY,
} from "./session-builder";

const DAY = "2026-09-25";
const DAY_MS = 24 * 60 * 60 * 1000;
const nowMs = Date.parse(`${DAY}T09:00:00.000Z`);

const makeWord = (index: number, extra: Partial<Word> = {}): Word =>
  wordSchema.parse({
    id: `mnd-w-${index}`,
    en: `word${index}`,
    ru: `слово${index}`,
    regionId: "mondstadt",
    theme: "greetings",
    partOfSpeech: "noun",
    ...extra,
  });

const words: Word[] = [
  ...Array.from({ length: 10 }, (_, index) => makeWord(index)),
  makeWord(20, { id: "mnd-fire-warm", en: "warm", element: "pyro", theme: "sounds" }),
  makeWord(21, { id: "mnd-water-wet", en: "wet", element: "hydro", theme: "sounds" }),
];

const quest = questSchema.parse({
  id: "mnd-q1-library",
  regionId: "mondstadt",
  titleRu: "Спящие слова библиотеки",
  kind: "commission",
  element: "geo",
  estimatedMinutes: 4,
  steps: [
    {
      kind: "exercises",
      titleRu: "Разбуди слово",
      mentorId: "noelle",
      items: [
        { type: "listen-pick", wordId: "mnd-w-0", distractorIds: ["mnd-w-1", "mnd-w-2"] },
        { type: "build-phrase", wordId: "mnd-w-3" },
      ],
    },
  ],
});

const secondQuest = questSchema.parse({
  ...quest,
  id: "mnd-q2-wind-song",
  titleRu: "Песня ветра",
  steps: [
    {
      kind: "exercises",
      titleRu: "Песня",
      mentorId: "venti",
      items: [{ type: "say-back", wordId: "mnd-w-4" }],
    },
  ],
});

const choiceQuest = questSchema.parse({
  ...quest,
  id: "mnd-q3-mill-count",
  titleRu: "Мельница и счёт",
  kind: "choice",
  steps: [
    {
      kind: "exercises",
      titleRu: "Счёт",
      mentorId: "amber",
      items: [{ type: "quick-match", wordIds: ["mnd-w-5", "mnd-w-6", "mnd-w-7"] }],
    },
  ],
});

const quests: Quest[] = [quest, secondQuest, choiceQuest];

const baseInput = (overrides: Partial<DayPlanInput> = {}): DayPlanInput => ({
  day: DAY,
  regionId: "mondstadt",
  words,
  quests,
  wordStates: [],
  nowMs,
  sparksLeft: 40,
  doneQuestIds: [],
  ...overrides,
});

describe("сборщик дня: дата и стилихия", () => {
  it("ключ дня читается по локальному времени", () => {
    expect(dayKeyOf(new Date(2026, 8, 25, 21, 30))).toBe("2026-09-25");
  });

  it("стихия дня детерминирована и меняется каждый день", () => {
    const elements = ["2026-09-25", "2026-09-26", "2026-09-27"].map(elementOfDay);
    expect(new Set(elements).size).toBe(3);
    expect(elementOfDay(DAY)).toBe(elementOfDay(DAY));
  });

  it("ротация стихий повторяется через неделю", () => {
    expect(elementOfDay("2026-10-02")).toBe(elementOfDay(DAY));
    expect(elementOfDay("2026-10-01")).toBe("pyro");
    expect(elementOfDay("2026-09-25")).toBe("hydro");
    expect(dayIndex("2026-10-02") - dayIndex(DAY)).toBe(7);
  });
});

describe("сборщик дня: четыре поручения", () => {
  it("при полном саде отдаёт четыре поручения", () => {
    const plan = buildDayPlan(baseInput());
    expect(plan.status).toBe("open");
    expect(plan.tasks).toHaveLength(TASKS_PER_DAY);
    expect(plan.tasks.map((task) => task.kind)).toEqual(["garden", "quest", "elemental", "choice"]);
  });

  it("детерминирован: два прогона на одних данных совпадают", () => {
    expect(buildDayPlan(baseInput())).toEqual(buildDayPlan(baseInput()));
  });

  it("при пустом саде первым идёт «посадить новые слова», день не пустой", () => {
    const plan = buildDayPlan(baseInput());
    expect(plan.dueWordIds).toEqual([]);
    expect(plan.tasks[0]?.kind).toBe("garden");
    expect(plan.tasks[0]?.wordIds.length).toBeGreaterThan(0);
  });

  it("поливает просроченные слова, а не новые", () => {
    const due = createWordState("mnd-w-0", nowMs - 3 * DAY_MS);
    const plan = buildDayPlan(baseInput({ wordStates: [due] }));
    expect(plan.dueWordIds).toEqual(["mnd-w-0"]);
    expect(plan.tasks[0]?.kind).toBe("garden");
    expect(plan.tasks[0]?.wordIds).toEqual(["mnd-w-0"]);
  });

  it("стихийная тренировка берёт слова сегодняшней стихии", () => {
    // 2026-10-01 — день Пиро, в наборе есть слово со стихией pyro.
    const plan = buildDayPlan(baseInput({ day: "2026-10-01" }));
    const elemental = plan.tasks.find((task) => task.kind === "elemental");
    expect(plan.elementOfDay).toBe("pyro");
    expect(elemental?.element).toBe("pyro");
    expect(elemental?.wordIds).toEqual(["mnd-fire-warm"]);
  });

  it("в день без слов своей стихии тренировка берёт слова нового дня", () => {
    // 2026-10-02 — день Гидро, в наборе есть слово со стихией hydro.
    const plan = buildDayPlan(baseInput({ day: "2026-10-02" }));
    expect(plan.elementOfDay).toBe("hydro");
    expect(plan.tasks.find((task) => task.kind === "elemental")?.wordIds).toEqual([
      "mnd-water-wet",
    ]);

    // 2026-09-26 — день Анемо, таких слов нет: тренировка повторяет слова нового дня.
    const anemoDay = buildDayPlan(baseInput({ day: "2026-09-26" }));
    const anemoTask = anemoDay.tasks.find((task) => task.kind === "elemental");
    expect(anemoDay.elementOfDay).toBe("anemo");
    expect(anemoTask?.wordIds.length).toBeGreaterThan(0);
    for (const wordId of anemoTask?.wordIds ?? []) {
      expect(anemoDay.newWordIds).toContain(wordId);
    }
  });

  it("квест дня — первый невыполненный, выполненные не повторяются", () => {
    const plan = buildDayPlan(baseInput({ doneQuestIds: ["mnd-q1-library"] }));
    expect(plan.tasks.find((task) => task.kind === "quest")?.questId).toBe("mnd-q2-wind-song");
  });

  it("бонусное поручение предлагает варианты, выбранный — единственный", () => {
    const options = buildDayPlan(baseInput()).tasks.find((task) => task.kind === "choice")?.options;
    expect(options).toHaveLength(1);
    const chosen = buildDayPlan(baseInput({ choiceQuestId: "mnd-q3-mill-count" }));
    expect(chosen.tasks.find((task) => task.kind === "choice")?.questId).toBe("mnd-q3-mill-count");
  });
});

describe("сборщик дня: новые слова и искры", () => {
  it("за день не больше четырёх новых слов", () => {
    const plan = buildDayPlan(baseInput());
    expect(plan.newWordIds.length).toBeLessThanOrEqual(MAX_NEW_WORDS_PER_DAY);
  });

  it("не выдаёт одно и то же новое слово дважды", () => {
    const plan = buildDayPlan(baseInput());
    expect(new Set(plan.newWordIds).size).toBe(plan.newWordIds.length);
  });

  it("выбирает квест, который влезает в дневной бюджет новых слов", () => {
    const heavyQuest = questSchema.parse({
      ...quest,
      id: "mnd-q0-heavy",
      steps: [
        {
          kind: "exercises",
          titleRu: "Много слов",
          mentorId: "noelle",
          items: Array.from({ length: 5 }, (_, index) => ({
            type: "say-back" as const,
            wordId: `mnd-w-${index}`,
          })),
        },
      ],
    });
    const plan = buildDayPlan(baseInput({ quests: [heavyQuest, quest] }));
    expect(plan.tasks.find((task) => task.kind === "quest")?.questId).toBe("mnd-q1-library");
  });

  it("при нуле искр день закрыт и задач нет", () => {
    const plan = buildDayPlan(baseInput({ sparksLeft: 0 }));
    expect(plan.status).toBe("closed");
    expect(plan.tasks).toEqual([]);
    expect(plan.xpPlanned).toBe(0);
  });

  it("при искрах меньше стоимости поручения день закрыт мягко", () => {
    expect(buildDayPlan(baseInput({ sparksLeft: 9 })).status).toBe("closed");
    expect(buildDayPlan(baseInput({ sparksLeft: 10 })).status).toBe("open");
  });
});

describe("сборщик дня: новые слова по саду", () => {
  it("слово, которое ребёнок уже повторял, новым больше не считается", () => {
    const state = reviewWord(createWordState("mnd-w-0", nowMs - DAY_MS), "remembered", nowMs);
    const fresh = freshWords(words, [state]);
    expect(fresh.map((word) => word.id)).not.toContain("mnd-w-0");
  });

  it("квест со сценой и наградой не ломает подсчёт новых слов", () => {
    const questWithScene = questSchema.parse({
      ...quest,
      id: "mnd-q4-dawn-song",
      steps: [
        {
          kind: "scene",
          scene: { id: "mnd-s-dawn", beats: [{ speakerId: "paimon", textRu: "Проснись" }] },
        },
        {
          kind: "exercises",
          titleRu: "Песня",
          mentorId: "venti",
          items: [{ type: "garden-water", wordIds: ["mnd-w-8", "mnd-w-9"] }],
        },
        { kind: "reward", chest: "rich" },
      ],
    });
    const plan = buildDayPlan(baseInput({ quests: [questWithScene] }));
    const planned = plan.tasks.find((task) => task.kind === "quest");
    expect(planned?.questId).toBe("mnd-q4-dawn-song");
    expect(planned?.wordIds).toEqual(["mnd-w-8", "mnd-w-9"]);
  });

  it("в регионе без комиссий день всё равно собирается", () => {
    const onlyChoice = buildDayPlan(baseInput({ quests: [choiceQuest] }));
    expect(onlyChoice.status).toBe("open");
    expect(onlyChoice.tasks.map((task) => task.kind)).toEqual(["garden", "elemental", "choice"]);
  });

  it("в регионе без квестов остаются сад и тренировка", () => {
    const bare = buildDayPlan(baseInput({ quests: [] }));
    expect(bare.tasks.map((task) => task.kind)).toEqual(["garden", "elemental"]);
  });

  it("выводит опыт плана из числа поручений", () => {
    const plan = buildDayPlan(baseInput());
    expect(plan.xpPlanned).toBe(plan.tasks.length * 10);
  });
});
