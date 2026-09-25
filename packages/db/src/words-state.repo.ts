/**
 * Репозиторий сада слов: состояния слов, просрочка и обновление после повторения
 * (task.md RF-5.1, NFR-6). Слова не удаляются никогда — «пропущенные дни ничего
 * не ломают», поэтому запись только перезаписывается по ключу wordId.
 */
import { reviewWord, type SrsGrade, type WordState, wordStateSchema } from "@tw/core";
import type { TeyvatDb, WordStateRow } from "./schema";

export const readAllWordStates = async (db: TeyvatDb): Promise<WordState[]> =>
  (await db.wordsState.toArray()).map((row) => wordStateSchema.parse(row));

export const readWordState = async (db: TeyvatDb, wordId: string): Promise<WordState | null> => {
  const row = await db.wordsState.get(wordId);
  return row ? wordStateSchema.parse(row) : null;
};

export const writeWordState = async (db: TeyvatDb, state: WordState): Promise<WordState> => {
  const value = wordStateSchema.parse(state);
  await db.wordsState.put(value);
  return value;
};

/** Записать состояния пачкой — так быстрее и не теряется часть сада при сбое. */
export const writeWordStates = async (
  db: TeyvatDb,
  states: readonly WordState[],
): Promise<number> => {
  const rows = states.map((state) => wordStateSchema.parse(state));
  await db.wordsState.bulkPut(rows);
  return rows.length;
};

/** Слова, которым пора пить: просроченные, сортировка — по сроку, потом по id. */
export const readDueWordStates = async (
  db: TeyvatDb,
  nowMs: number,
  limit = 8,
): Promise<WordState[]> => {
  const states = await readAllWordStates(db);
  return states
    .filter((state) => Date.parse(state.dueAt) <= nowMs)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.wordId.localeCompare(b.wordId))
    .slice(0, limit);
};

/** Повторить слово в саду: состояние пересчитывается движком и сохраняется. */
export const reviewStoredWord = async (
  db: TeyvatDb,
  wordId: string,
  grade: SrsGrade,
  nowMs: number,
): Promise<WordState | null> => {
  const current = await readWordState(db, wordId);
  if (!current) {
    return null;
  }
  return writeWordState(db, reviewWord(current, grade, nowMs));
};

/**
 * Сколько слов «ожило» — счётчик для шапки и рапорта родителю (RF-2.2).
 * Поле live булево, а значит не индексируется: считаем фильтром по записям.
 */
export const countLiveWords = async (db: TeyvatDb): Promise<number> =>
  (await db.wordsState.toArray()).filter((row) => row.live).length;

export type { WordStateRow };
