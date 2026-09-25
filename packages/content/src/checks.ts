/** Перекрёстные проверки каталога: уникальность id и целостность ссылок. */
import type { Companion, Exercise, PaimonBank, Quest, Reaction, Region, Word } from "@tw/core";

export type CatalogParts = {
  regions: Region[];
  words: Word[];
  quests: Quest[];
  companions: Companion[];
  reactions: Reaction[];
  paimonBank: PaimonBank;
};

const exerciseWordIds = (exercise: Exercise): string[] => {
  switch (exercise.type) {
    case "listen-pick":
      return [exercise.wordId, ...exercise.distractorIds];
    case "quick-match":
    case "garden-water":
      return exercise.wordIds;
    default:
      return [exercise.wordId];
  }
};

export const findCatalogProblems = (parts: CatalogParts): string[] => {
  const problems: string[] = [];

  const checkUniqueIds = (items: ReadonlyArray<{ id: string }>, label: string) => {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id)) {
        problems.push(`${label}: дубликат id «${item.id}»`);
      }
      seen.add(item.id);
    }
  };

  checkUniqueIds(parts.regions, "Регионы");
  checkUniqueIds(parts.words, "Слова");
  checkUniqueIds(parts.quests, "Квесты");
  checkUniqueIds(parts.companions, "Спутники");
  checkUniqueIds(parts.reactions, "Реакции");

  const regionIds = new Set(parts.regions.map((region) => region.id));
  const companionIds = new Set(parts.companions.map((companion) => companion.id));
  const wordIds = new Set(parts.words.map((word) => word.id));

  for (const word of parts.words) {
    if (!regionIds.has(word.regionId)) {
      problems.push(`Слово «${word.id}»: неизвестный регион «${word.regionId}»`);
    }
  }

  for (const region of parts.regions) {
    for (const mentorId of region.mentors) {
      if (!companionIds.has(mentorId)) {
        problems.push(`Регион «${region.id}»: неизвестный наставник «${mentorId}»`);
      }
    }
  }

  for (const quest of parts.quests) {
    if (!regionIds.has(quest.regionId)) {
      problems.push(`Квест «${quest.id}»: неизвестный регион «${quest.regionId}»`);
    }
    const sceneIds = new Set<string>();
    for (const step of quest.steps) {
      if (step.kind === "scene") {
        sceneIds.add(step.scene.id);
      }
    }
    for (const step of quest.steps) {
      if (step.kind === "exercises") {
        if (!companionIds.has(step.mentorId)) {
          problems.push(`Квест «${quest.id}»: неизвестный наставник «${step.mentorId}»`);
        }
        for (const exercise of step.items) {
          for (const id of exerciseWordIds(exercise)) {
            if (!wordIds.has(id)) {
              problems.push(
                `Квест «${quest.id}»: упражнение ссылается на неизвестное слово «${id}»`,
              );
            }
          }
        }
      }
      if (step.kind === "retell") {
        for (const sceneId of step.sceneIds) {
          if (!sceneIds.has(sceneId)) {
            problems.push(
              `Квест «${quest.id}»: пересказ ссылается на сцену «${sceneId}» из другого квеста`,
            );
          }
        }
      }
    }
  }

  return problems;
};
