/**
 * Детерминированный генератор псевдослучайных чисел. Нужен там, где случайность
 * допустима по геймплею (перемешивание блоков фразы, выбор из двух поручений), но
 * обязана повторяться: одна и та же дата и тот же квест дают одну и ту же раскладку
 * (task.md G2, «детерминирован при одной дате»).
 */
export type Rng = () => number;

/** Классический mulberry32: 32 бита состояния, seeded, без внешних зависимостей. */
export const createRng = (seed: number): Rng => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Стабильный сид из строки: одинаковый текст — одинаковый порядок. */
export const seedFrom = (text: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** Тасование Фишера—Йетса детерминированным генератором. */
export const shuffle = <T>(items: readonly T[], rng: Rng): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const left = result[i] as T;
    const right = result[j] as T;
    result[i] = right;
    result[j] = left;
  }
  return result;
};
