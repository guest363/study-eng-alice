/**
 * Хранилище прогресса: схема IndexedDB версии 1 (task.md §8.3, NFR-6).
 *
 * Версия схемы растёт только через migrations: каждая новая версия описывает, что
 * именно переносится, поэтому «повреждённые» данные восстанавливаются к последнему
 * целому состоянию, а не обнуляются.
 */

import {
  type DayRecord,
  dayRecordSchema,
  type Inventory,
  inventorySchema,
  type JournalEntry,
  journalEntrySchema,
  type SessionRecord,
  type Settings,
  sessionRecordSchema,
  settingsSchema,
  type WordState,
  wordStateSchema,
} from "@tw/core";
import Dexie, { type EntityTable } from "dexie";

/** Ключ единственной записи настроек и инвентаря. */
export const SINGLETON_KEY = "current";

/** Ключи таблиц уже входят в контракты (wordId, day, id) — дублировать их не нужно. */
export type WordStateRow = WordState;
export type DayRow = DayRecord;
export type SessionRow = SessionRecord;
export type JournalRow = JournalEntry & { seq: number };
export type SettingsRow = { key: string; value: Settings };
export type InventoryRow = { key: string } & Inventory;

/** Имена object-store совпадают с именами свойств класса: так Dexie их и связывает. */
export const TABLES = {
  wordsState: "wordsState",
  days: "days",
  sessions: "sessions",
  journal: "journal",
  settings: "settings",
  inventory: "inventory",
} as const;

/** Версия 2 — заготовка миграции: к этому гейту таблицы не менялись (G2, задача 5). */
export const NEXT_SCHEMA_VERSION = 2;

export class TeyvatDb extends Dexie {
  // declare, а не «!»: иначе class-field затирает таблицы, которые Dexie создаёт в конструкторе.
  declare wordsState: EntityTable<WordStateRow, "wordId">;
  declare days: EntityTable<DayRow, "day">;
  declare sessions: EntityTable<SessionRow, "id">;
  declare journal: EntityTable<JournalRow, "seq">;
  declare settings: EntityTable<SettingsRow, "key">;
  declare inventory: EntityTable<InventoryRow, "key">;

  constructor(name = "teyvat-words") {
    super(name);
    this.version(1).stores({
      // live — булево поле, IndexedDB его не индексирует: счётчик живых слов считаем фильтром.
      [TABLES.wordsState]: "&wordId, dueAt",
      [TABLES.days]: "&day, closedAt",
      [TABLES.sessions]: "&id, day, questId, status, [day+status]",
      [TABLES.journal]: "++seq, day, at, type, subject, [day+type]",
      [TABLES.settings]: "&key",
      [TABLES.inventory]: "&key",
    });
    this.version(NEXT_SCHEMA_VERSION)
      .stores({
        [TABLES.wordsState]: "&wordId, dueAt",
        [TABLES.days]: "&day, closedAt",
        [TABLES.sessions]: "&id, day, questId, status, [day+status]",
        [TABLES.journal]: "++seq, day, at, type, subject, [day+type]",
        [TABLES.settings]: "&key",
        [TABLES.inventory]: "&key",
      })
      .upgrade(async (tx) => {
        // Заготовка: когда появится новое поле, здесь пишется перенос данных,
        // а тест миграции проверяет, что старые строки пережили переход (NFR-6).
        await Promise.all([
          tx.table(TABLES.wordsState).toCollection().count(),
          tx.table(TABLES.sessions).toCollection().count(),
        ]);
      });
  }
}

let instance: TeyvatDb | null = null;

/** Одна база на приложение: её пересоздание ломает быстрые ссылки TanStack Query. */
export const getDb = (name?: string): TeyvatDb => {
  if (!instance || (name && instance.name !== name)) {
    instance = new TeyvatDb(name);
  }
  return instance;
};

/** Для тестов: забыть синглтон, чтобы открыть базу с другим именем. */
export const resetDb = (): void => {
  instance = null;
};

export const parseWordState = (row: WordStateRow): WordState => wordStateSchema.parse(row);
export const parseDay = (row: DayRow): DayRecord => dayRecordSchema.parse(row);
export const parseSession = (row: SessionRow): SessionRecord => sessionRecordSchema.parse(row);
export const parseJournal = (row: JournalRow): JournalEntry => journalEntrySchema.parse(row);
export const parseSettings = (row: SettingsRow): Settings => settingsSchema.parse(row);
export const parseInventory = (row: InventoryRow): Inventory => inventorySchema.parse(row);
