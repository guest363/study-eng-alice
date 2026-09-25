/**
 * Фабрики queryKey для TanStack Query (task.md §8.3). Ключи собраны в одном месте,
 * чтобы инвалидация после мутации не расходилась с чтением.
 */

export const settingsKeys = {
  all: ["settings"] as const,
  current: () => [...settingsKeys.all, "current"] as const,
};

export const inventoryKeys = {
  all: ["inventory"] as const,
  current: () => [...inventoryKeys.all, "current"] as const,
};

export const wordStateKeys = {
  all: ["words-state"] as const,
  allWords: () => [...wordStateKeys.all, "all"] as const,
  word: (wordId: string) => [...wordStateKeys.all, "word", wordId] as const,
  due: (nowMs: number) => [...wordStateKeys.all, "due", nowMs] as const,
  liveCount: () => [...wordStateKeys.all, "live-count"] as const,
};

export const dayKeys = {
  all: ["days"] as const,
  day: (day: string) => [...dayKeys.all, day] as const,
  recent: (limit: number) => [...dayKeys.all, "recent", limit] as const,
  plan: (day: string, regionId: string) => [...dayKeys.all, "plan", day, regionId] as const,
};

export const sessionKeys = {
  all: ["sessions"] as const,
  session: (id: string) => [...sessionKeys.all, id] as const,
  open: (questId: string) => [...sessionKeys.all, "open", questId] as const,
  byDay: (day: string) => [...sessionKeys.all, "day", day] as const,
};

export const journalKeys = {
  all: ["journal"] as const,
  byDay: (day: string) => [...journalKeys.all, "day", day] as const,
  between: (fromDay: string, toDay: string) =>
    [...journalKeys.all, "between", fromDay, toDay] as const,
};

/** Ключи дня целиком: после поручения инвалидируется всё, что про него знает. */
export const progressKeys = {
  all: ["progress"] as const,
  day: (day: string) => [...progressKeys.all, "day", day] as const,
  words: () => [...progressKeys.all, "words"] as const,
};
