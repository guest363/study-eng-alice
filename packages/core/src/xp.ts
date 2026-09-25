/**
 * Опыт и ранг Хранителя (task.md §4.5). Только числа: титулы ранга — текст игры,
 * он живёт в контенте (гейт G6, «Кодекс путешествий»), здесь их не дублируем.
 */

/** Опыт за решённое упражнение: одинаковый для всех типов, разница — в реакциях. */
export const XP_PER_EXERCISE = 5;

/** Опыт за повторение слова в саду — меньше, ведь это не новое слово. */
export const XP_PER_REVIEW = 2;

/** Опыт за показанный ответ после двух подсказок: меньше обычного, но не ноль — ошибку не наказываем. */
export const XP_PER_SHOWN = 3;

/** Опыт за выполненное поручение дня (не за упражнение внутри него). */
export const XP_PER_TASK = 10;

/** Награда за сундук поручения (RF-9.1). */
export const XP_PER_CHEST = { common: 5, rich: 10, precious: 20 } as const;

/** Пороги рангов AR1–AR8: сколько всего опыта нужно, чтобы подняться. */
export const RANK_THRESHOLDS = [0, 40, 100, 200, 350, 550, 800, 1200] as const;

export const MAX_RANK = RANK_THRESHOLDS.length;

/** Ранг по накопленному опыту: 1…8, никогда не выше потолка. */
export const rankByXp = (xp: number): number => {
  let rank = 1;
  RANK_THRESHOLDS.forEach((threshold, index) => {
    if (xp >= threshold) {
      rank = index + 1;
    }
  });
  return rank;
};

/** Опыт до следующего ранга; на максимальном ранге — 0. */
export const xpToNextRank = (xp: number): number => {
  const rank = rankByXp(xp);
  const next = RANK_THRESHOLDS[rank];
  return next === undefined ? 0 : next - xp;
};
