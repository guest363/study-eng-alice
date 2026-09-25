/**
 * Репозиторий сессий: сессия переживает перезагрузку страницы (RF-3.4), поэтому её
 * прогресс пишется в базу, а не живёт в состоянии компонента.
 */
import { type SessionRecord, sessionRecordSchema } from "@tw/core";
import type { SessionRow, TeyvatDb } from "./schema";

export const readSession = async (db: TeyvatDb, id: string): Promise<SessionRecord | null> => {
  const row = await db.sessions.get(id);
  return row ? sessionRecordSchema.parse(row) : null;
};

export const writeSession = async (db: TeyvatDb, record: SessionRecord): Promise<SessionRecord> => {
  const value = sessionRecordSchema.parse(record);
  await db.sessions.put(value);
  return value;
};

export const startSession = async (db: TeyvatDb, record: SessionRecord): Promise<SessionRecord> =>
  writeSession(db, { ...sessionRecordSchema.parse(record), status: "in-progress" });

/** Сохранить место, на котором остановились: выход в любой момент (RF-3.4). */
export const saveSessionProgress = async (
  db: TeyvatDb,
  id: string,
  patch: { stepIndex?: number; stepTotal?: number; xpGained?: number },
): Promise<SessionRecord | null> =>
  db.transaction("rw", db.sessions, async () => {
    const current = await readSession(db, id);
    if (current?.status !== "in-progress") {
      return current;
    }
    return writeSession(db, { ...current, ...patch });
  });

/** Закрыть сессию: успех всегда, «бросила» — тоже запись, без наказания. */
export const finishSession = async (
  db: TeyvatDb,
  id: string,
  finishedAt: string,
): Promise<SessionRecord | null> =>
  db.transaction("rw", db.sessions, async () => {
    const current = await readSession(db, id);
    if (!current) {
      return null;
    }
    return writeSession(db, { ...current, status: "done", finishedAt });
  });

/** Незакрытая сессия квеста — по ней экран предлагает продолжить (RF-3.4). */
export const readOpenSession = async (
  db: TeyvatDb,
  questId: string,
): Promise<SessionRecord | null> => {
  const rows = await db.sessions.where("questId").equals(questId).toArray();
  const open = rows
    .map((row: SessionRow) => sessionRecordSchema.parse(row))
    .find((session) => session.status === "in-progress");
  return open ?? null;
};

export const listSessionsByDay = async (db: TeyvatDb, day: string): Promise<SessionRecord[]> => {
  const rows = await db.sessions.where("day").equals(day).toArray();
  return rows.map((row: SessionRow) => sessionRecordSchema.parse(row));
};
