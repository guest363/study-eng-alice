/**
 * Валидатор контента: обходит src/, прогоняет каждый файл через Zod-схемы
 * и перекрёстные проверки. Ключ `yarn content:validate` — падает сборка при
 * любом нарушении контракта (task.md G1).
 *
 * Запуск: yarn content:validate (tsx, Node без Vite — import.meta.glob не участвует).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import type { Companion, Labels, PaimonBank, Quest, Reaction, Region, Word } from "@tw/core";
import { type CatalogParts, findCatalogProblems } from "../src/checks";
import { parseContentFile } from "../src/load";

const srcDir = resolve(import.meta.dirname, "../src");

const collectFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full));
    } else if (/\.(md|json)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
};

/** Заглушка для сбора проблем: до валидации дело не дойдёт. */
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

const problems: string[] = [];
const regions: Region[] = [];
const words: Word[] = [];
const quests: Quest[] = [];
const companions: Companion[] = [];
const reactions: Reaction[] = [];
let paimonBank: PaimonBank | null = null;
let labels: Labels | null = null;

const files = collectFiles(srcDir).sort();

if (files.length === 0) {
  problems.push("В src/ не найдено ни одного файла контента");
}

for (const file of files) {
  const relPath = relative(srcDir, file);
  const raw = readFileSync(file, "utf8");
  try {
    const parsed = parseContentFile(relPath, raw);
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
        reactions.push(...parsed.value);
        break;
      case "paimon-bank":
        paimonBank = parsed.value;
        break;
      case "labels":
        labels = parsed.value;
        break;
      default:
        break;
    }
  } catch (error) {
    problems.push(`${relPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const parts: CatalogParts = {
  regions,
  words,
  quests,
  companions,
  reactions,
  paimonBank: paimonBank ?? EMPTY_PAIMON_BANK,
};
problems.push(...findCatalogProblems(parts));

if (!paimonBank) {
  problems.push("Не найден paimon/bank.json");
}
if (!labels) {
  problems.push("Не найден ui/labels.json");
}

for (const region of regions) {
  const regionWords = words.filter((word) => word.regionId === region.id);
  if (regionWords.length === 0) {
    problems.push(`Регион «${region.id}»: нет ни одного слова (words.json)`);
  }
}

if (problems.length > 0) {
  console.error(`✖ Контент не прошёл проверки (${problems.length}):`);
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}

console.log(
  `✔ Контент валиден: регионов ${regions.length}, слов ${words.length}, квестов ${quests.length}, спутников ${companions.length}, реакций ${reactions.length}, реплик Паймон ${Object.values(parts.paimonBank).reduce((sum, list) => sum + list.length, 0)}`,
);
