import { describe, expect, it } from "vitest";
import { parseFrontmatter, parseJson } from "./parser";

describe("parseFrontmatter", () => {
  it("разбирает JSON-заголовок и возвращает тело", () => {
    const raw = '---\n{"id": "test"}\n---\nЗаметки редактора';
    const { data, body } = parseFrontmatter(raw, "test.md");
    expect(data).toEqual({ id: "test" });
    expect(body).toBe("Заметки редактора");
  });

  it("падает с понятной ошибкой без заголовка", () => {
    expect(() => parseFrontmatter("просто текст", "битый.md")).toThrow(/JSON-заголовка/);
  });
});

describe("parseJson", () => {
  it("разбирает корректный JSON", () => {
    expect(parseJson('[{"a": 1}]', "a.json")).toEqual([{ a: 1 }]);
  });

  it("упоминает источник в ошибке", () => {
    expect(() => parseJson("{битый", "путь/к.json")).toThrow(/путь\/к\.json/);
  });
});
