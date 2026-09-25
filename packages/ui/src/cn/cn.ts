/** Склейка классов: игнорирует пустые и ложные значения. */
export const cn = (...parts: ReadonlyArray<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");
