import { describe, expect, it } from "vitest";
import { loadCatalog } from "./catalog";

/**
 * Страховочный тест: весь реальный контент репозитория должен проходить
 * Zod-схемы и перекрёстные проверки (дубль content:validate в CI).
 */
describe("каталог контента репозитория", () => {
  const catalog = loadCatalog();

  it("содержит первый регион Мондштадт", () => {
    expect(catalog.regions.map((region) => region.id)).toContain("mondstadt");
  });

  it("в Мондштадте не меньше 30 слов", () => {
    const words = catalog.words.filter((word) => word.regionId === "mondstadt");
    expect(words.length).toBeGreaterThanOrEqual(30);
  });

  it("в банке Паймон не меньше 40 реплик суммарно", () => {
    const total = Object.values(catalog.paimonBank).reduce((sum, list) => sum + list.length, 0);
    expect(total).toBeGreaterThanOrEqual(40);
  });

  it("содержит спутников-наставников региона 1 и Ноэлль среди них", () => {
    const ids = catalog.companions.map((companion) => companion.id);
    expect(ids).toEqual(expect.arrayContaining(["noelle", "amber", "venti", "paimon"]));
  });

  it("содержит пять детерминированных реакций", () => {
    expect(catalog.reactions).toHaveLength(5);
  });

  it("в регионе есть и комиссия, и архонт-квест", () => {
    const kinds = catalog.quests
      .filter((quest) => quest.regionId === "mondstadt")
      .map((quest) => quest.kind);
    expect(kinds).toContain("commission");
    expect(kinds).toContain("archon");
  });

  it("не содержит запрещённых формулировок страха ошибки (task.md §6.4)", () => {
    const forbidden = /(неправильн|ошибк|попробуй снова|неудач|проигрыш)/i;
    const texts: string[] = [
      ...Object.values(catalog.paimonBank).flat(),
      ...catalog.companions.flatMap((companion) => [
        ...companion.praise,
        ...companion.almost,
        ...companion.hint,
      ]),
      ...catalog.quests.map((quest) => `${quest.titleRu} ${quest.cliffhangerRu ?? ""}`),
      ...catalog.quests.flatMap((quest) =>
        quest.steps.flatMap((step) =>
          "scene" in step ? step.scene.beats.map((beat) => beat.textRu) : [],
        ),
      ),
    ];
    const bad = texts.filter((text) => forbidden.test(text));
    expect(bad).toEqual([]);
  });
});
