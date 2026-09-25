/** Календарь приложения: сегодняшний день по местному времени и «сейчас». */
import { dayKeyOf } from "@tw/core";

export const today = (): string => dayKeyOf(new Date());

export const now = (): number => Date.now();

/** Ключ дня, сдвинутый на сдвиг дней: нужно недельному отчёту родителю. */
export const dayKeyOffset = (day: string, offset: number): string => {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return dayKeyOf(date);
};

/** Последние семь дней, от сегодняшнего назад — неделя отчёта. */
export const lastWeekDays = (day: string): string[] =>
  Array.from({ length: 7 }, (_, index) => dayKeyOffset(day, -index));

export const formatTime = (ms: number): string =>
  new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
