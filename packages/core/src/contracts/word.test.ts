import { describe, expect, it } from "vitest";
import { wordSchema } from "./word";

const baseWord = {
  id: "mnd-greet-hello",
  en: "hello",
  ru: "привет",
  regionId: "mondstadt",
  theme: "greetings",
  partOfSpeech: "excl",
};

describe("wordSchema", () => {
  it("принимает корректное слово и подставляет значения по умолчанию", () => {
    const word = wordSchema.parse(baseWord);
    expect(word.media).toEqual({});
    expect(word.tags).toEqual([]);
  });

  it("отказывает слову без русского значения", () => {
    const { ru: _ru, ...withoutRu } = baseWord;
    expect(() => wordSchema.parse(withoutRu)).toThrow(/ru/);
  });

  it("отказывает в id с заглавными буквами", () => {
    expect(() => wordSchema.parse({ ...baseWord, id: "Mnd-Hello" })).toThrow();
  });

  it("принимает фразу с медиа и примером", () => {
    const word = wordSchema.parse({
      ...baseWord,
      id: "mnd-greet-thankyou",
      en: "thank you",
      partOfSpeech: "phrase",
      emoji: "🙏",
      example: { en: "Thank you, Noelle!", ru: "Спасибо, Ноэлль!" },
      media: { icon: "icon-mnd-greet-thankyou" },
    });
    expect(word.media.icon).toBe("icon-mnd-greet-thankyou");
  });
});
