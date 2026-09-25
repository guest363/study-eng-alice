/**
 * Контракты прогресса: состояние слова в саду, день, сессия, журнал, инвентарь.
 * Хранятся в IndexedDB пакета @tw/db (task.md §8.3), Zod-схемы — общие для db и core.
 */
import { z } from "zod";

const isoInstantSchema = z.iso.datetime({ error: "Ожидается дата-время в формате ISO" });
const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "День ожидается в формате ГГГГ-ММ-ДД");

/**
 * Оценка повторения в саду слов. Идентификаторы — механика, подписи для ребёнка
 * лежат в контенте (ui/labels.json), чтобы текст игры не жил в коде (agent.md, правило 7).
 */
export const srsGradeSchema = z.enum(["remembered", "hinted", "forgotten"]);

/** Состояние одного слова — выход FSRS-lite (task.md §8.4). */
export const wordStateSchema = z.object({
  wordId: z.string().min(1, "У состояния слова нет wordId"),
  /** Интервал до следующего повторения в днях: 0 в день первого изучения, дальше 1/3/7/14/30. */
  stability: z.number().int().min(0).max(365),
  /** Трудность 1–5: растёт от «подскажи» и забываний, падает от уверенных «вспомнила». */
  difficulty: z.number().int().min(1).max(5),
  dueAt: isoInstantSchema,
  /** Все повторения, включая неудачные. */
  reps: z.number().int().min(0),
  /** Сколько раз слово забывали. */
  lapses: z.number().int().min(0),
  /** Успешные повторения — «вспомнила» или «подскажи». */
  successfulReps: z.number().int().min(0),
  /** Слово «ожило»: не меньше трёх успешных повторений (RF-5.1). */
  live: z.boolean(),
  /** До какого момента слово защищено звездой памяти (RF-5.4), иначе null. */
  starProtectedUntil: isoInstantSchema.nullable(),
  firstSeenAt: isoInstantSchema,
  lastReviewedAt: isoInstantSchema.nullable(),
});

export type WordState = z.infer<typeof wordStateSchema>;
export type SrsGrade = z.infer<typeof srsGradeSchema>;

/** День путешественницы: искры, выполненные поручения, новые слова (task.md §4.4). */
export const dayRecordSchema = z.object({
  day: dayKeySchema,
  sparksLeft: z.number().int().min(0).max(40),
  tasksPlanned: z.number().int().min(0).max(4),
  tasksDone: z.number().int().min(0).max(4),
  newWordIds: z.array(z.string()).default([]),
  reviewedWordIds: z.array(z.string()).default([]),
  xpGained: z.number().int().min(0).default(0),
  crystalsGained: z.number().int().min(0).default(0),
  questIds: z.array(z.string()).default([]),
  closedAt: isoInstantSchema.nullable(),
});

export type DayRecord = z.infer<typeof dayRecordSchema>;

/** Сессия — одно пройденное поручение. Статус «в процессе» переживает перезагрузку (RF-3.4). */
export const sessionStatusSchema = z.enum(["in-progress", "done", "abandoned"]);

export const sessionRecordSchema = z.object({
  id: z.string().min(1, "У сессии нет id"),
  day: dayKeySchema,
  questId: z.string().min(1, "У сессии нет questId"),
  kind: z.enum(["commission", "choice", "archon", "garden", "elemental"]),
  element: z.string().optional(),
  status: sessionStatusSchema,
  stepIndex: z.number().int().min(0).default(0),
  stepTotal: z.number().int().min(0).default(0),
  xpGained: z.number().int().min(0).default(0),
  startedAt: isoInstantSchema,
  finishedAt: isoInstantSchema.nullable(),
});

export type SessionRecord = z.infer<typeof sessionRecordSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;

/** Журнал — локальная лента событий для родительского отчёта (NFR-1, RF-11.2). */
export const journalTypeSchema = z.enum([
  "day-open",
  "session-start",
  "session-end",
  "word",
  "reaction",
  "chest",
  "rank",
  "settings",
]);

export const journalEntrySchema = z.object({
  day: dayKeySchema,
  at: isoInstantSchema,
  type: journalTypeSchema,
  /** Короткий ключ события: id слова, id квеста, id реакции. */
  subject: z.string().min(1, "У события журнала нет subject"),
  amount: z.number().optional(),
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;
export type JournalType = z.infer<typeof journalTypeSchema>;

/** Инвентарь: кристаллы, собранные карточки слов, открытые спутники (RF-9). */
export const inventorySchema = z.object({
  crystals: z.number().int().min(0).default(0),
  wordCardIds: z.array(z.string()).default([]),
  companionIds: z.array(z.string()).default([]),
  /** Открытые комбо реакций — «Кодекс реакций» (RF-7.2). */
  reactionIds: z.array(z.string()).default([]),
  /** Косметика из «Лавки Марджори»: только рамки и фоны (RF-9.3). */
  cosmetics: z.array(z.string()).default([]),
});

export type Inventory = z.infer<typeof inventorySchema>;
