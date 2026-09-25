/**
 * FSRS-lite — интервальное повторение для ребёнка 7–8 лет (task.md RF-5.1, §3.2).
 *
 * Почему не ts-fsrs: детский режим переопределяет почти всё (интервалы 1/3/7/14/30 дней,
 * три оценки вместо четырёх, никакой оптимизации весов под пользователя). Свои ~150 строк
 * прозрачнее и предсказуемее: интервалы всегда попадают в таблицу, а «пропущенные дни»
 * ничего не ломают.
 *
 * Модуль чистый: ни React, ни DOM, ни Date.now() — момент времени передаётся
 * аргументом nowMs, поэтому тесты детерминированы.
 */
import type { SrsGrade, WordState } from "../contracts";
import { wordStateSchema } from "../contracts";

/** Лестница интервалов в днях (task.md RF-5.1). */
export const SRS_INTERVALS = [1, 3, 7, 14, 30] as const;

/** Столько успешных повторений нужно, чтобы слово «ожило» (RF-5.1). */
export const LIVE_AFTER_SUCCESSFUL_REPS = 3;

/** Минимальный интервал, при котором повторение считается успешным для «ожившего» слова. */
export const MIN_LIVE_INTERVAL_DAYS = 1;

/** Стартовая и предельная трудность. */
export const START_DIFFICULTY = 3;
export const MAX_DIFFICULTY = 5;
export const MIN_DIFFICULTY = 1;

/**
 * Насколько лёгким считается слово: три подряд уверенных «вспомнила» опускают
 * трудность до 1, и дальше такое слово растёт сразу на два шага.
 */
export const EASY_DIFFICULTY = 1;

/** Звезда памяти держит слово от просрочки (RF-5.4). */
export const STAR_PROTECTION_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toIso = (ms: number) => new Date(ms).toISOString();

/** Индекс интервала в лестнице по числу дней (0 — «завтра», дальше 1/3/7/14/30). */
export const intervalIndex = (stabilityDays: number): number =>
  SRS_INTERVALS.findIndex((days) => days === stabilityDays);

/** Текущая ступень лестницы: -1 у ещё не повторённого слова, чтобы первое успешное повторение дало 1 день. */
const ladderIndex = (state: WordState): number =>
  state.reps === 0 ? -1 : intervalIndex(state.stability);

/** Слово ждёт полива: срок наступил (звезда памяти сдвигает срок, а не отменяет его). */
export const isDue = (state: WordState, nowMs: number): boolean =>
  new Date(state.dueAt).getTime() <= nowMs;

/** Стадия растения в саду: росток → бутон → цветок (RF-5.2). */
export type PlantStage = "sprout" | "bud" | "flower";

export const plantStage = (state: WordState): PlantStage => {
  if (state.live) {
    return "flower";
  }
  return state.successfulReps >= 1 ? "bud" : "sprout";
};

/**
 * Новое слово сада: увидела впервые, повторить завтра. Сразу «живым» не становится —
 * для этого нужны три успешных повторения.
 */
export const createWordState = (wordId: string, nowMs: number): WordState =>
  wordStateSchema.parse({
    wordId,
    stability: 0,
    difficulty: START_DIFFICULTY,
    dueAt: toIso(nowMs),
    reps: 0,
    lapses: 0,
    successfulReps: 0,
    live: false,
    starProtectedUntil: null,
    firstSeenAt: toIso(nowMs),
    lastReviewedAt: null,
  });

/**
 * Пересчёт состояния после повторения.
 *
 * remembered — уверенно: интервал растёт на шаг (на два, если слово даётся легко),
 *                трудность падает.
 * hinted     — вспомнила с подсказкой: интервал растёт на шаг, трудность растёт.
 * forgotten  — не вспомнила: возврат на первый шаг (завтра), счётчик забываний растёт.
 *
 * Просрочка сама по себе ничего не меняет: хоть пять пропущенных дней — stability
 * и difficulty те же, срок лишь в прошлом.
 */
export const reviewWord = (state: WordState, grade: SrsGrade, nowMs: number): WordState => {
  const currentIndex = ladderIndex(state);

  if (grade === "forgotten") {
    return wordStateSchema.parse({
      ...state,
      stability: SRS_INTERVALS[0],
      difficulty: clamp(state.difficulty + 1, MIN_DIFFICULTY, MAX_DIFFICULTY),
      dueAt: toIso(nowMs + SRS_INTERVALS[0] * DAY_MS),
      reps: state.reps + 1,
      lapses: state.lapses + 1,
      starProtectedUntil: null,
      lastReviewedAt: toIso(nowMs),
    });
  }

  const step = grade === "remembered" && state.difficulty <= EASY_DIFFICULTY ? 2 : 1;
  const nextIndex = clamp(currentIndex + step, 0, SRS_INTERVALS.length - 1);
  const nextStability = SRS_INTERVALS[nextIndex];

  const difficulty =
    grade === "remembered"
      ? clamp(state.difficulty - 1, MIN_DIFFICULTY, MAX_DIFFICULTY)
      : clamp(state.difficulty + 1, MIN_DIFFICULTY, MAX_DIFFICULTY);

  const successfulReps = state.successfulReps + 1;
  const live =
    successfulReps >= LIVE_AFTER_SUCCESSFUL_REPS && nextStability >= MIN_LIVE_INTERVAL_DAYS;

  return wordStateSchema.parse({
    ...state,
    stability: nextStability,
    difficulty,
    dueAt: toIso(nowMs + nextStability * DAY_MS),
    reps: state.reps + 1,
    successfulReps,
    live,
    lastReviewedAt: toIso(nowMs),
  });
};

/**
 * Звезда памяти: реакция Кристаллизация или награда защищают слово от просрочки
 * на 7 дней (RF-5.4). Защита продлевает срок, а не делает слово «вечно свежим»:
 * после защиты обычный сад снова поливает.
 */
export const protectWithStar = (state: WordState, nowMs: number): WordState => {
  const dueMs = Math.max(new Date(state.dueAt).getTime(), nowMs);
  return wordStateSchema.parse({
    ...state,
    dueAt: toIso(dueMs + STAR_PROTECTION_DAYS * DAY_MS),
    starProtectedUntil: toIso(dueMs + STAR_PROTECTION_DAYS * DAY_MS),
  });
};

/** Реакция Бутонизация: «полила в саду» — срок повторения сдвигается на нужное число дней. */
export const extendInterval = (state: WordState, days = 1): WordState =>
  wordStateSchema.parse({
    ...state,
    dueAt: toIso(new Date(state.dueAt).getTime() + days * DAY_MS),
  });

/** Защита истекла — звёздочку снимаем, чтобы сад снова напоминал о слове. */
export const clearExpiredStar = (state: WordState, nowMs: number): WordState => {
  if (!state.starProtectedUntil) {
    return state;
  }
  if (new Date(state.starProtectedUntil).getTime() > nowMs) {
    return state;
  }
  return wordStateSchema.parse({ ...state, starProtectedUntil: null });
};
