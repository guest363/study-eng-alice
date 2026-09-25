/**
 * Сборщик дня — четыре поручения по порядку (task.md §4.4, RF-3.5, RF-5.3).
 *
 * День детерминирован: одна и та же дата, одно и то же состояние сада и один и тот же
 * набор выполненных квестов дают один и тот же план. Никакого рандома в механиках.
 *
 * Движок не знает про тексты: подписи Паймон, наставников и подсказки приходят
 * из контента, движок возвращает только структуру дня.
 */
import type { Quest, Word, WordState } from "../contracts";
import { ELEMENT_IDS, type ElementId, SPARKS_PER_TASK } from "../elements";
import { taughtWordIds, wordIdsOf } from "../exercises/answers";
import { dueWordStates, GARDEN_BATCH_MAX } from "../exercises/garden-water";
import { XP_PER_TASK } from "../xp";

/** Новых слов за день — не больше четырёх (RF-5.3, приёмка G2). */
export const MAX_NEW_WORDS_PER_DAY = 4;

/** Поручений в день — четыре (task.md §4.4). */
export const TASKS_PER_DAY = 4;

export const TASK_KINDS = ["garden", "quest", "elemental", "choice"] as const;

export type TaskKind = (typeof TASK_KINDS)[number];

export type ChoiceOption = Readonly<{ questId: string; titleRu: string }>;

export type PlannedTask = Readonly<{
  id: string;
  kind: TaskKind;
  titleRu: string;
  element: ElementId;
  questId: string | null;
  /** Слова упражнения: для сада — поливаемые, для квеста и тренировки — свои. */
  wordIds: readonly string[];
  /** Для бонусного поручения — два варианта на выбор (автономия, task.md §4.4). */
  options: readonly ChoiceOption[];
  chest: "common" | "rich" | "precious";
  estimatedMinutes: number;
}>;

export type DayPlan = Readonly<{
  day: string;
  /** closed — искры кончились, день закрыт (RF-3.5). */
  status: "open" | "closed";
  tasks: readonly PlannedTask[];
  /** Стихия дня: тренировка по стихии, ротация по дням недели. */
  elementOfDay: ElementId;
  newWordIds: readonly string[];
  dueWordIds: readonly string[];
  xpPlanned: number;
}>;

export type DayPlanInput = Readonly<{
  /** Ключ дня в локальном времени: ГГГГ-ММ-ДД. */
  day: string;
  /** Регион, который сейчас открыт: его квесты и слова идут в день. */
  regionId: string;
  words: readonly Word[];
  quests: readonly Quest[];
  wordStates: readonly WordState[];
  /** Момент «сейчас»: план не должен зависеть от Date.now() внутри движка. */
  nowMs: number;
  sparksLeft: number;
  doneQuestIds: readonly string[];
  /** Выбор ребёнка для бонусного поручения; null — предлагаем два варианта. */
  choiceQuestId?: string | null;
}>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Ключ дня в локальном времени: без времени, чтобы не «прыгать» между UTC и локалью. */
export const dayKeyOf = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/** Порядковый номер дня от 1970-01-01 UTC — им крутится ротация стихий. */
export const dayIndex = (day: string): number =>
  Math.floor(Date.parse(`${day}T00:00:00.000Z`) / DAY_MS);

/** Стихия дня: детерминированная ротация по семи дням. */
export const elementOfDay = (day: string): ElementId => {
  const index = ((dayIndex(day) % ELEMENT_IDS.length) + ELEMENT_IDS.length) % ELEMENT_IDS.length;
  return ELEMENT_IDS[index] ?? "anemo";
};

/**
 * Слова, которых ребёнок ещё не видел: их нет в саду или они ни разу не повторялись.
 * Порядок — как в контенте, поэтому лексика региона раскрывается по темам.
 */
export const freshWords = (words: readonly Word[], states: readonly WordState[]): Word[] => {
  const seen = new Set(states.filter((state) => state.reps > 0).map((state) => state.wordId));
  return words.filter((word) => !seen.has(word.id));
};

/** Слова квеста, которые показываем в упражнениях. */
export const questWordIds = (quest: Quest): string[] => {
  const ids = new Set<string>();
  for (const step of quest.steps) {
    if (step.kind !== "exercises") {
      continue;
    }
    for (const exercise of step.items) {
      for (const id of wordIdsOf(exercise)) {
        ids.add(id);
      }
    }
  }
  return [...ids];
};

const freshIdsOfQuest = (quest: Quest, freshIds: ReadonlySet<string>): string[] => {
  const ids = new Set<string>();
  for (const step of quest.steps) {
    if (step.kind !== "exercises") {
      continue;
    }
    for (const exercise of step.items) {
      for (const id of taughtWordIds(exercise)) {
        if (freshIds.has(id)) {
          ids.add(id);
        }
      }
    }
  }
  return [...ids];
};

const sortedById = (quests: readonly Quest[]): Quest[] =>
  [...quests].sort((a, b) => a.id.localeCompare(b.id));

/** Собрать день. Все четыре поручения строятся всегда: если сад пуст, первым идёт
 * «посадить новые слова», а не пустой экран (приёмка G2). */
export const buildDayPlan = (input: DayPlanInput): DayPlan => {
  const { day, regionId, words, quests, wordStates, nowMs, sparksLeft, doneQuestIds } = input;
  const element = elementOfDay(day);
  const due = dueWordStates(wordStates, nowMs, GARDEN_BATCH_MAX);
  const dueWordIds = due.map((state) => state.wordId);

  if (sparksLeft < SPARKS_PER_TASK) {
    return {
      day,
      status: "closed",
      tasks: [],
      elementOfDay: element,
      newWordIds: [],
      dueWordIds,
      xpPlanned: 0,
    };
  }

  const regionWords = words.filter((word) => word.regionId === regionId);
  const regionQuests = sortedById(quests.filter((quest) => quest.regionId === regionId));
  const commissions = regionQuests.filter((quest) => quest.kind === "commission");
  const choices = regionQuests.filter((quest) => quest.kind === "choice");

  const fresh = freshWords(regionWords, wordStates);
  const freshIds = new Set(fresh.map((word) => word.id));

  // Новые слова квеста идут первыми: сюжет важнее, а бюджет дня общий.
  const undone = commissions.filter((quest) => !doneQuestIds.includes(quest.id));
  const affordable = undone.filter(
    (quest) => freshIdsOfQuest(quest, freshIds).length <= MAX_NEW_WORDS_PER_DAY,
  );
  const fallback = sortedById(undone).sort(
    (a, b) =>
      freshIdsOfQuest(a, freshIds).length - freshIdsOfQuest(b, freshIds).length ||
      a.id.localeCompare(b.id),
  );
  const quest = affordable[0] ?? fallback[0] ?? commissions[0] ?? null;

  const newWordIds: string[] = [];
  const takeFresh = (limit: number): string[] => {
    const room = Math.max(0, MAX_NEW_WORDS_PER_DAY - newWordIds.length);
    const taken = fresh
      .filter((word) => !newWordIds.includes(word.id))
      .slice(0, Math.min(limit, room))
      .map((word) => word.id);
    newWordIds.push(...taken);
    return taken;
  };

  if (quest) {
    newWordIds.push(...freshIdsOfQuest(quest, freshIds).slice(0, MAX_NEW_WORDS_PER_DAY));
  }

  // Сад: поливаем просроченное, а если сад пуст — сажаем новые слова.
  const gardenWordIds = dueWordIds.length > 0 ? dueWordIds : takeFresh(MAX_NEW_WORDS_PER_DAY);

  // Стихийная тренировка: слова сегодняшней стихии, новые — в пределах бюджета.
  const elementalPool = regionWords.filter((word) => word.element === element);
  let elementalWordIds = elementalPool
    .filter((word) => !newWordIds.includes(word.id))
    .slice(0, 3)
    .map((word) => word.id);
  if (elementalWordIds.length === 0) {
    elementalWordIds = takeFresh(3);
  }

  const options = pickChoiceOptions(choices, input.choiceQuestId ?? null);
  const choiceQuest = options[0]
    ? (regionQuests.find((q) => q.id === options[0]?.questId) ?? null)
    : null;

  const tasks: PlannedTask[] = [
    {
      id: `${day}-garden`,
      kind: "garden",
      titleRu: "Сад слов",
      element: "dendro",
      questId: null,
      wordIds: gardenWordIds,
      options: [],
      chest: "common",
      estimatedMinutes: 3,
    },
  ];

  if (quest) {
    tasks.push({
      id: `${day}-quest-${quest.id}`,
      kind: "quest",
      titleRu: quest.titleRu,
      element: quest.element ?? "geo",
      questId: quest.id,
      wordIds: questWordIds(quest),
      options: [],
      chest: "common",
      estimatedMinutes: quest.estimatedMinutes,
    });
  }

  tasks.push({
    id: `${day}-elemental`,
    kind: "elemental",
    titleRu: "Стихийная тренировка",
    element,
    questId: null,
    wordIds: elementalWordIds.length > 0 ? elementalWordIds : newWordIds.slice(0, 3),
    options: [],
    chest: "common",
    estimatedMinutes: 3,
  });

  if (choiceQuest) {
    tasks.push({
      id: `${day}-choice-${choiceQuest.id}`,
      kind: "choice",
      titleRu: choiceQuest.titleRu,
      element: choiceQuest.element ?? element,
      questId: choiceQuest.id,
      wordIds: questWordIds(choiceQuest),
      options,
      chest: "common",
      estimatedMinutes: choiceQuest.estimatedMinutes,
    });
  }

  return {
    day,
    status: "open",
    tasks,
    elementOfDay: element,
    newWordIds: newWordIds.slice(0, MAX_NEW_WORDS_PER_DAY),
    dueWordIds,
    xpPlanned: tasks.length * XP_PER_TASK,
  };
};

/**
 * Два варианта бонусного поручения. Выбор ребёнка — это автономия (task.md §4.4),
 * поэтому варианты всегда предложены, а не назначены свыше.
 */
const pickChoiceOptions = (
  choices: readonly Quest[],
  chosenQuestId: string | null,
): ChoiceOption[] => {
  const asOptions = (quest: Quest): ChoiceOption => ({ questId: quest.id, titleRu: quest.titleRu });
  const chosen = chosenQuestId ? choices.find((quest) => quest.id === chosenQuestId) : undefined;
  if (chosen) {
    return [asOptions(chosen)];
  }
  return sortedById(choices).slice(0, 2).map(asOptions);
};
