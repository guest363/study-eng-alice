/**
 * @tw/db — хранилище прогресса: схема Dexie (версионируется), репозитории,
 * фабрики queryKey/queryFn для TanStack Query (task.md §8.3).
 *
 * Здесь нет React и нет компонентов: репозитории возвращают данные, а экраны читают
 * их через useQuery с ключами из query-keys.ts.
 */

export {
  closeDay,
  emptyDay,
  listRecentDays,
  readDay,
  spendSparks,
  updateDay,
  writeDay,
} from "./days.repo";
export {
  appendJournal,
  type JournalDraft,
  listJournalBetween,
  listJournalByDay,
} from "./journal.repo";
export * from "./query-keys";
export {
  getDb,
  NEXT_SCHEMA_VERSION,
  parseDay,
  parseInventory,
  parseJournal,
  parseSession,
  parseSettings,
  parseWordState,
  resetDb,
  SINGLETON_KEY,
  TABLES,
  TeyvatDb,
} from "./schema";
export {
  finishSession,
  listSessionsByDay,
  readOpenSession,
  readSession,
  saveSessionProgress,
  startSession,
  writeSession,
} from "./sessions.repo";
export {
  DEFAULT_INVENTORY,
  DEFAULT_SETTINGS,
  readInventory,
  readSettings,
  resetProgress,
  writeInventory,
  writeSettings,
} from "./settings.repo";
export {
  countLiveWords,
  readAllWordStates,
  readDueWordStates,
  readWordState,
  reviewStoredWord,
  writeWordState,
  writeWordStates,
} from "./words-state.repo";
