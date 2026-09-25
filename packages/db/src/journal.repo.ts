/**
 * Журнал: локальная лента событий для родительского отчёта (RF-11.2, NFR-1).
 * Ничего не уходит наружу, данные не покидают устройство.
 */
import { type JournalEntry, type JournalType, journalEntrySchema } from "@tw/core";
import type { JournalRow, TeyvatDb } from "./schema";

export type JournalDraft = Readonly<{
  day: string;
  at: string;
  type: JournalType;
  subject: string;
  amount?: number;
}>;

export const appendJournal = async (db: TeyvatDb, draft: JournalDraft): Promise<JournalEntry> => {
  const value = journalEntrySchema.parse(draft);
  const seq = await db.journal.add(value);
  return journalEntrySchema.parse({ ...value, seq });
};

export const listJournalByDay = async (db: TeyvatDb, day: string): Promise<JournalEntry[]> => {
  const rows = await db.journal.where("day").equals(day).toArray();
  return rows
    .map((row: JournalRow) => journalEntrySchema.parse(row))
    .sort((a, b) => a.at.localeCompare(b.at));
};

/** События за период — недельный отчёт собирается только из них. */
export const listJournalBetween = async (
  db: TeyvatDb,
  fromDay: string,
  toDay: string,
): Promise<JournalEntry[]> => {
  const rows = await db.journal.where("day").between(fromDay, toDay, true, true).toArray();
  return rows
    .map((row: JournalRow) => journalEntrySchema.parse(row))
    .sort((a, b) => a.at.localeCompare(b.at));
};
