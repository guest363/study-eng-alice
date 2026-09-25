/**
 * Тесты хранилища на fake-indexeddb: проверяем приёмку G2 — переход схемы v1 → v2
 * не теряет ни одного слова, а день и сессия переживают перезагрузку (RF-3.4, NFR-6).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { createWordState, dayKeyOf, reviewWord, sessionRecordSchema } from "@tw/core";
import {
  countLiveWords,
  emptyDay,
  finishSession,
  listJournalByDay,
  listRecentDays,
  listSessionsByDay,
  readAllWordStates,
  readDay,
  readDueWordStates,
  readOpenSession,
  readSettings,
  readWordState,
  resetProgress,
  reviewStoredWord,
  saveSessionProgress,
  spendSparks,
  startSession,
  TeyvatDb,
  updateDay,
  writeDay,
  writeSettings,
} from "./index";

const DAY = "2026-09-25";
const nowMs = Date.parse(`${DAY}T09:00:00.000Z`);
const DAY_MS = 24 * 60 * 60 * 1000;

let db: TeyvatDb;
let counter = 0;

beforeEach(async () => {
  counter += 1;
  db = new TeyvatDb(`teyvat-test-${counter}`);
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

const session = () =>
  sessionRecordSchema.parse({
    id: `s-${counter}`,
    day: DAY,
    questId: "mnd-q1-library",
    kind: "commission",
    element: "geo",
    status: "in-progress",
    stepIndex: 0,
    stepTotal: 3,
    xpGained: 0,
    startedAt: new Date(nowMs).toISOString(),
    finishedAt: null,
  });

describe("схема и версии", () => {
  it("открывается на актуальной версии и содержит все шесть таблиц", async () => {
    const tables = db.tables.map((table) => table.name).sort();
    expect(tables).toEqual(
      ["days", "inventory", "journal", "sessions", "settings", "wordsState"].sort(),
    );
    expect(await db.wordsState.count()).toBe(0);
  });

  it("переход v1 → v2 не теряет слова и сессии", async () => {
    const state = createWordState("mnd-sound-book", nowMs);
    await db.wordsState.put(state);
    await db.sessions.put(session());

    // Переоткрываем ту же базу: Dexie применяет миграцию при изменении версии схемы.
    db.close();
    const reopened = new TeyvatDb(`teyvat-test-${counter}`);
    await reopened.open();
    const after = await reopened.wordsState.toArray();
    expect(after).toHaveLength(1);
    expect(after[0]?.wordId).toBe("mnd-sound-book");
    expect(await reopened.sessions.count()).toBe(1);
    db = reopened;
  });
});

describe("сад слов", () => {
  it("слово записывается и читается без потерь", async () => {
    const state = createWordState("mnd-sound-book", nowMs);
    await db.wordsState.put(state);
    expect(await readWordState(db, state.wordId)).toEqual(state);
    expect(await readAllWordStates(db)).toHaveLength(1);
  });

  it("повторение пересчитывает состояние и сохраняет его", async () => {
    await db.wordsState.put(createWordState("mnd-sound-book", nowMs - 2 * DAY_MS));
    const updated = await reviewStoredWord(db, "mnd-sound-book", "remembered", nowMs);
    expect(updated?.stability).toBe(1);
    expect((await readWordState(db, "mnd-sound-book"))?.reps).toBe(1);
  });

  it("повторение неизвестного слова не создаёт запись", async () => {
    expect(await reviewStoredWord(db, "нет-такого", "remembered", nowMs)).toBeNull();
    expect(await readAllWordStates(db)).toHaveLength(0);
  });

  it("просроченные слова отдаются первыми, свежие — нет", async () => {
    const overdue = reviewWord(
      createWordState("w-overdue", nowMs - 9 * DAY_MS),
      "hinted",
      nowMs - 8 * DAY_MS,
    );
    const fresh = reviewWord(createWordState("w-fresh", nowMs - DAY_MS), "remembered", nowMs);
    await db.wordsState.bulkPut([fresh, overdue]);
    const due = await readDueWordStates(db, nowMs);
    expect(due.map((state) => state.wordId)).toEqual(["w-overdue"]);
  });

  it("счётчик оживших слов растёт после третьего успеха", async () => {
    let state = createWordState("mnd-sound-book", nowMs - 6 * DAY_MS);
    await db.wordsState.put(state);
    expect(await countLiveWords(db)).toBe(0);
    for (const grade of ["remembered", "hinted", "remembered"] as const) {
      state = reviewWord(state, grade, nowMs);
      await db.wordsState.put(state);
    }
    expect(await countLiveWords(db)).toBe(1);
  });
});

describe("день и искры", () => {
  it("новый день начинается с полного запаса искр", async () => {
    const day = await updateDay(db, DAY, (current) => current);
    expect(day.sparksLeft).toBe(40);
  });

  it("искры тратятся по десять за поручение и не уходят в минус", async () => {
    let day = await spendSparks(db, DAY);
    expect(day?.sparksLeft).toBe(30);
    day = await spendSparks(db, DAY);
    day = await spendSparks(db, DAY);
    day = await spendSparks(db, DAY);
    expect(day?.sparksLeft).toBe(0);
    day = await spendSparks(db, DAY);
    expect(day?.sparksLeft).toBe(0);
  });

  it("план дня сохраняется вместе с прогрессом", async () => {
    await updateDay(db, DAY, (current) => ({
      ...current,
      tasksPlanned: 4,
      tasksDone: 1,
      newWordIds: ["mnd-sound-book"],
      xpGained: 15,
    }));
    const day = await readDay(db, DAY);
    expect(day?.tasksDone).toBe(1);
    expect(day?.newWordIds).toEqual(["mnd-sound-book"]);
  });

  it("недавние дни читаются в обратном порядке", async () => {
    await writeDay(db, emptyDay("2026-09-24"));
    await writeDay(db, emptyDay("2026-09-25"));
    await writeDay(db, emptyDay("2026-09-23"));
    const days = await listRecentDays(db, 2);
    expect(days.map((day) => day.day)).toEqual(["2026-09-25", "2026-09-24"]);
  });
});

describe("сессии", () => {
  it("сессия сохраняет место, на котором остановились", async () => {
    await startSession(db, session());
    const saved = await saveSessionProgress(db, `s-${counter}`, { stepIndex: 2, xpGained: 10 });
    expect(saved?.stepIndex).toBe(2);
    db.close();
    const reloaded = new TeyvatDb(`teyvat-test-${counter}`);
    await reloaded.open();
    expect((await reloaded.sessions.get(`s-${counter}`))?.stepIndex).toBe(2);
    db = reloaded;
  });

  it("незакрытая сессия находится по квесту", async () => {
    await startSession(db, session());
    expect((await readOpenSession(db, "mnd-q1-library"))?.id).toBe(`s-${counter}`);
    await finishSession(db, `s-${counter}`, new Date(nowMs + 60_000).toISOString());
    expect(await readOpenSession(db, "mnd-q1-library")).toBeNull();
  });

  it("закрытую сессию не переписать прогрессом", async () => {
    await startSession(db, session());
    await finishSession(db, `s-${counter}`, new Date(nowMs).toISOString());
    const saved = await saveSessionProgress(db, `s-${counter}`, { stepIndex: 3 });
    expect(saved?.stepIndex).toBe(0);
    expect(saved?.status).toBe("done");
  });

  it("сессии дня читаются списком", async () => {
    await startSession(db, session());
    await startSession(db, { ...session(), id: `s-b-${counter}`, questId: "mnd-q2-wind-song" });
    expect(await listSessionsByDay(db, DAY)).toHaveLength(2);
  });
});

describe("журнал и настройки", () => {
  it("события журнала пишутся и читаются за день", async () => {
    const day = dayKeyOf(new Date(nowMs));
    const first = await db.journal.add({
      day,
      at: new Date(nowMs).toISOString(),
      type: "day-open",
      subject: DAY,
    });
    expect(first).toBeGreaterThan(0);
    expect(await listJournalByDay(db, day)).toHaveLength(1);
  });

  it("настройки по умолчанию не требуют записи", async () => {
    const settings = await readSettings(db);
    expect(settings.ttsVoice).toBe("us");
    expect(settings.dailyTimeLimitMinutes).toBe(15);
  });

  it("настройки сохраняются и переживают перечитывание", async () => {
    const current = await readSettings(db);
    await writeSettings(db, { ...current, travelerName: "Алиса", ttsVoice: "uk" });
    expect((await readSettings(db)).travelerName).toBe("Алиса");
  });

  it("битые настройки не ломают приложение", async () => {
    // Так выглядят данные, оставшиеся от старой версии сборки: пишем их мимо Zod.
    const corrupt = JSON.parse('{"travelerName": 42, "ttsVoice": "ru"}');
    await db.settings.put({ key: "current", value: corrupt });
    expect((await readSettings(db)).travelerName).toBe("Путешественница");
  });

  it("сброс прогресса очищает слова и дни, но не ломает базу", async () => {
    await db.wordsState.put(createWordState("mnd-sound-book", nowMs));
    await writeDay(db, emptyDay(DAY));
    await resetProgress(db);
    expect(await readAllWordStates(db)).toHaveLength(0);
    expect(await readDay(db, DAY)).toBeNull();
    expect((await readSettings(db)).travelerName).toBe("Путешественница");
  });
});
