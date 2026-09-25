/**
 * Каталог контента для экранов: один раз при загрузке приложения + готовые словари.
 * Экраны читают только отсюда, дублировать контент в компонентах запрещено
 * (agent.md, правило 7).
 */
import { loadCatalog } from "@tw/content";
import type { Companion, Quest, Word } from "@tw/core";

export const catalog = loadCatalog();

export const wordsById: ReadonlyMap<string, Word> = new Map(
  catalog.words.map((word) => [word.id, word]),
);
export const questsById: ReadonlyMap<string, Quest> = new Map(
  catalog.quests.map((quest) => [quest.id, quest]),
);
export const companionsById: ReadonlyMap<string, Companion> = new Map(
  catalog.companions.map((companion) => [companion.id, companion]),
);

/** Публичный путь асс��та по ключу манифеста; null — рисуем заглушку. */
export const mediaSrc = (key: string | null | undefined): string | null =>
  key ? (catalog.media[key]?.file ?? null) : null;

export const wordOf = (id: string): Word | null => wordsById.get(id) ?? null;
export const questOf = (id: string): Quest | null => questsById.get(id) ?? null;
export const companionOf = (id: string): Companion | null => companionsById.get(id) ?? null;

export const regionOf = (id: string) => catalog.regions.find((region) => region.id === id) ?? null;

/** Порядок регионов по карте: от первого к последнему. */
export const orderedRegions = [...catalog.regions].sort((a, b) => a.order - b.order);

export const regionWords = (regionId: string): Word[] =>
  catalog.words.filter((word) => word.regionId === regionId);

export const regionQuests = (regionId: string): Quest[] =>
  catalog.quests.filter((quest) => quest.regionId === regionId);

/** Слово по id для карточек упражнений; отсутствующее не должно ронять экран. */
export const wordsOf = (ids: readonly string[]): Word[] =>
  ids.map((id) => wordsById.get(id)).filter((word): word is Word => word !== undefined);
