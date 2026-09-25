/**
 * Репозиторий дня: искры, выполненные поручения, новые слова (task.md §4.4, §4.5).
 * Искры не копятся: новый день начинается с полного запаса и без «долга» (RF-3.5).
 */
import { DAILY_SPARKS_CAP, type DayRecord, dayRecordSchema, SPARKS_PER_TASK } from "@tw/core";
import type { DayRow, TeyvatDb } from "./schema";

/** Пустой день: четыре поручения в плане, ни одного выполненного. */
export const emptyDay = (day: string, sparksLeft = DAILY_SPARKS_CAP): DayRecord =>
  dayRecordSchema.parse({
    day,
    sparksLeft,
    tasksPlanned: 0,
    tasksDone: 0,
    newWordIds: [],
    reviewedWordIds: [],
    xpGained: 0,
    crystalsGained: 0,
    questIds: [],
    closedAt: null,
  });

export const readDay = async (db: TeyvatDb, day: string): Promise<DayRecord | null> => {
  const row = await db.days.get(day);
  return row ? dayRecordSchema.parse(row) : null;
};

export const writeDay = async (db: TeyvatDb, record: DayRecord): Promise<DayRecord> => {
  const value = dayRecordSchema.parse(record);
  await db.days.put(value);
  return value;
};

/**
 * Запись дня: если записи нет — создаём с полным запасом искр. Одна транзакция на
 * чтение и запись, чтобы два быстрых тапа не потеряли искры.
 */
export const updateDay = async (
  db: TeyvatDb,
  day: string,
  patch: (day: DayRecord) => DayRecord,
): Promise<DayRecord> =>
  db.transaction("rw", db.days, async () => {
    const current = (await readDay(db, day)) ?? emptyDay(day);
    return writeDay(db, patch(current));
  });

/** Потратить искры на поручение. Недостаток — возвращаем false, день закрыт. */
export const spendSparks = async (db: TeyvatDb, day: string): Promise<DayRecord | null> =>
  updateDay(db, day, (current) => {
    if (current.sparksLeft < SPARKS_PER_TASK) {
      return current;
    }
    return { ...current, sparksLeft: current.sparksLeft - SPARKS_PER_TASK };
  });

/** Закрыть день: деньги не тратятся, просто записано время. */
export const closeDay = async (db: TeyvatDb, day: string, at: string): Promise<DayRecord> =>
  updateDay(db, day, (current) => ({ ...current, closedAt: at }));

export const listRecentDays = async (db: TeyvatDb, limit = 7): Promise<DayRecord[]> => {
  const rows = await db.days.orderBy("day").reverse().limit(limit).toArray();
  return rows.map((row: DayRow) => dayRecordSchema.parse(row));
};
