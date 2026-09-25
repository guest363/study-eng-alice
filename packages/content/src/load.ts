/** Разбор и валидация одного файла контента. Общий код для рантайма (Vite) и node-скриптов (tsx). */
import {
  type Companion,
  companionSchema,
  type MediaManifest,
  mediaManifestSchema,
  type PaimonBank,
  paimonBankSchema,
  type Quest,
  questSchema,
  type Reaction,
  type Region,
  reactionListSchema,
  regionSchema,
  type Word,
  wordListSchema,
} from "@tw/core";
import { parseFrontmatter, parseJson } from "./parser";
import { classifyPath } from "./paths";

export type ParsedFile =
  | { kind: "region"; regionSlug: string; value: Region }
  | { kind: "words"; regionSlug: string; value: Word[] }
  | { kind: "quest"; regionSlug: string; value: Quest }
  | { kind: "region-media"; regionSlug: string; value: MediaManifest }
  | { kind: "companion"; value: Companion }
  | { kind: "paimon-bank"; value: PaimonBank }
  | { kind: "reactions"; value: Reaction[] }
  | { kind: "global-media"; value: MediaManifest };

export const parseContentFile = (relPath: string, raw: string): ParsedFile => {
  const kind = classifyPath(relPath);
  if (!kind) {
    throw new Error(
      `неизвестный тип файла контента (ожидались region.md, words.json, quests/*.md, манифесты, companions/*.md, paimon/bank.json, reactions.json)`,
    );
  }
  switch (kind.kind) {
    case "region":
      return { ...kind, value: regionSchema.parse(parseFrontmatter(raw, relPath).data) };
    case "words":
      return { ...kind, value: wordListSchema.parse(parseJson(raw, relPath)) };
    case "quest":
      return { ...kind, value: questSchema.parse(parseFrontmatter(raw, relPath).data) };
    case "region-media":
    case "global-media":
      return { ...kind, value: mediaManifestSchema.parse(parseJson(raw, relPath)) };
    case "companion":
      return { ...kind, value: companionSchema.parse(parseFrontmatter(raw, relPath).data) };
    case "paimon-bank":
      return { ...kind, value: paimonBankSchema.parse(parseJson(raw, relPath)) };
    case "reactions":
      return { ...kind, value: reactionListSchema.parse(parseJson(raw, relPath)) };
  }
};
