/** Каталог контента: сбор, валидация Zod и перекрёстные проверки при первом обращении. */
import type {
  Companion,
  Labels,
  MediaEntry,
  PaimonBank,
  Quest,
  Reaction,
  Region,
  Word,
} from "@tw/core";
import { findCatalogProblems } from "./checks";
import { type ParsedFile, parseContentFile } from "./load";

const rawModules = import.meta.glob("./**/*.{md,json}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export type Catalog = Readonly<{
  regions: readonly Region[];
  words: readonly Word[];
  quests: readonly Quest[];
  companions: readonly Companion[];
  reactions: readonly Reaction[];
  paimonBank: PaimonBank;
  /** Подписи кнопок движка: оценки сада и действия упражнений. */
  labels: Labels;
  /** Слитые манифесты: глобальный + региональные. */
  media: Readonly<Record<string, MediaEntry>>;
}>;

/** Заглушки нужны только для сбора проблем — до них дело не дойдёт, валидатор упадёт. */
const EMPTY_PAIMON_BANK: PaimonBank = {
  dayOpen: [],
  praise: [],
  almost: [],
  hint: [],
  cliffhanger: [],
  rest: [],
  garden: [],
  chest: [],
  choice: [],
};

let cached: Catalog | null = null;

export const loadCatalog = (): Catalog => {
  if (cached) {
    return cached;
  }

  const regions: Region[] = [];
  const words: Word[] = [];
  const quests: Quest[] = [];
  const companions: Companion[] = [];
  let reactions: Reaction[] = [];
  let paimonBank: PaimonBank | null = null;
  let labels: Labels | null = null;
  const media: Record<string, MediaEntry> = {};
  const problems: string[] = [];

  for (const [key, raw] of Object.entries(rawModules)) {
    const relPath = key.replace(/^\.\//, "");
    let parsed: ParsedFile;
    try {
      parsed = parseContentFile(relPath, raw);
    } catch (error) {
      problems.push(`${relPath}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    switch (parsed.kind) {
      case "region":
        regions.push(parsed.value);
        break;
      case "words":
        words.push(...parsed.value);
        break;
      case "quest":
        quests.push(parsed.value);
        break;
      case "companion":
        companions.push(parsed.value);
        break;
      case "reactions":
        reactions = parsed.value;
        break;
      case "paimon-bank":
        paimonBank = parsed.value;
        break;
      case "labels":
        labels = parsed.value;
        break;
      case "global-media":
      case "region-media": {
        for (const [mediaKey, entry] of Object.entries(parsed.value)) {
          if (mediaKey in media) {
            problems.push(`${relPath}: дубликат медиа-ключа «${mediaKey}»`);
          }
          media[mediaKey] = entry;
        }
        break;
      }
    }
  }

  if (!paimonBank) {
    problems.push("Не найден paimon/bank.json");
  }
  if (!labels) {
    problems.push("Не найден ui/labels.json");
  }

  problems.push(
    ...findCatalogProblems({
      regions,
      words,
      quests,
      companions,
      reactions,
      paimonBank: paimonBank ?? EMPTY_PAIMON_BANK,
    }),
  );

  for (const region of regions) {
    const regionWords = words.filter((word) => word.regionId === region.id);
    if (regionWords.length === 0) {
      problems.push(`Регион «${region.id}»: нет ни одного слова (words.json)`);
    }
  }

  if (problems.length > 0 || !paimonBank || !labels) {
    throw new Error(`Контент не прошёл проверки:\n- ${problems.join("\n- ")}`);
  }

  cached = Object.freeze({
    regions: Object.freeze(regions),
    words: Object.freeze(words),
    quests: Object.freeze(quests),
    companions: Object.freeze(companions),
    reactions: Object.freeze(reactions),
    paimonBank,
    labels,
    media: Object.freeze(media),
  });
  return cached;
};
