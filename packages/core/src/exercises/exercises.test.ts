/**
 * Тесты логики упражнений (без UI): варианты listen-pick, блоки фразы, отбор слов сада.
 */
import { describe, expect, it } from "vitest";
import { type Exercise, type Word, wordSchema } from "../contracts";
import { createWordState, reviewWord } from "../fsrs/fsrs-lite";
import { createRng, seedFrom, shuffle } from "../random";
import { checkAnswer, SAID_ANSWER, targetWordId, wordIdsOf } from "./answers";
import { isPhraseCorrect, phraseBlocks, shuffledBlocks } from "./build-phrase";
import { dueWordStates, isGardenGrade } from "./garden-water";
import { buildListenPickOptions, isListenPickCorrect } from "./listen-pick";

const DAY = 24 * 60 * 60 * 1000;
const nowMs = Date.UTC(2026, 8, 25, 9, 0, 0);

const book = wordSchema.parse({
  id: "mnd-sound-book",
  en: "book",
  ru: "книга",
  regionId: "mondstadt",
  theme: "sounds",
  partOfSpeech: "noun",
  emoji: "📕",
});
const plain = wordSchema.parse({
  id: "mnd-sound-note",
  en: "note",
  ru: "заметка",
  regionId: "mondstadt",
  theme: "sounds",
  partOfSpeech: "noun",
});
const apple = wordSchema.parse({
  id: "mnd-sound-apple",
  en: "apple",
  ru: "яблоко",
  regionId: "mondstadt",
  theme: "sounds",
  partOfSpeech: "noun",
  emoji: "🍎",
});
const iCanJump = wordSchema.parse({
  id: "mnd-move-icanjump",
  en: "I can jump",
  ru: "я умею прыгать",
  regionId: "mondstadt",
  theme: "move",
  partOfSpeech: "phrase",
});

const wordsById = new Map<string, Word>([
  [book.id, book],
  [plain.id, plain],
  [apple.id, apple],
  [iCanJump.id, iCanJump],
]);

const listenPick: Extract<Exercise, { type: "listen-pick" }> = {
  type: "listen-pick",
  wordId: book.id,
  distractorIds: [apple.id, plain.id],
};

describe("listen-pick: варианты", () => {
  it("собирает правильный ответ и distractors в порядке упражнения", () => {
    const options = buildListenPickOptions(listenPick, wordsById);
    expect(options.map((option) => option.wordId)).toEqual([book.id, apple.id, plain.id]);
    expect(options.filter((option) => option.correct)).toHaveLength(1);
  });

  it("на карточке показывается эмодзи, а без него — само слово", () => {
    const options = buildListenPickOptions(listenPick, wordsById);
    expect(options[0]).toMatchObject({ label: "📕", isEmoji: true });
    expect(options[2]).toMatchObject({ label: "note", isEmoji: false });
  });

  it("неизвестное слово не ломает экран: показываем id", () => {
    const options = buildListenPickOptions(
      { type: "listen-pick", wordId: "нет-такого", distractorIds: [apple.id] },
      wordsById,
    );
    expect(options[0]?.label).toBe("нет-такого");
  });

  it("верным считается только слово упражнения", () => {
    expect(isListenPickCorrect(listenPick, book.id)).toBe(true);
    expect(isListenPickCorrect(listenPick, apple.id)).toBe(false);
  });
});

describe("build-phrase: блоки", () => {
  it("режет фразу на слова-блоки", () => {
    expect(phraseBlocks(iCanJump).map((block) => block.text)).toEqual(["I", "can", "jump"]);
  });

  it("блоки фразы тасуются детерминированно: тот же день — тот же порядок", () => {
    const first = shuffledBlocks(iCanJump, "2026-09-25");
    const second = shuffledBlocks(iCanJump, "2026-09-25");
    expect(first.map((block) => block.id)).toEqual(second.map((block) => block.id));
    expect(first).toHaveLength(3);
  });

  it("разные дни могут давать разный порядок, но порядок всегда полный", () => {
    const monday = shuffledBlocks(iCanJump, "2026-09-28")
      .map((block) => block.id)
      .sort();
    const tuesday = shuffledBlocks(iCanJump, "2026-09-29")
      .map((block) => block.id)
      .sort();
    expect(monday).toEqual(tuesday);
    expect(monday).toEqual(
      phraseBlocks(iCanJump)
        .map((block) => block.id)
        .sort(),
    );
  });

  it("односложную фразу не тасуем — её нечего собирать", () => {
    expect(shuffledBlocks(book, "2026-09-25").map((block) => block.text)).toEqual(["book"]);
  });

  it("фраза собрана, если порядок блоков совпал с эталоном", () => {
    const correct = phraseBlocks(iCanJump).map((block) => block.id);
    expect(isPhraseCorrect(iCanJump, correct)).toBe(true);
    expect(isPhraseCorrect(iCanJump, [...correct].reverse())).toBe(false);
    expect(isPhraseCorrect(iCanJump, correct.slice(0, 2))).toBe(false);
  });
});

describe("garden-water: отбор слов", () => {
  it("берёт только просроченные слова и не больше восьми", () => {
    const states = Array.from({ length: 10 }, (_, index) =>
      createWordState(`w-${index}`, nowMs - 5 * DAY),
    );
    expect(dueWordStates(states, nowMs)).toHaveLength(8);
  });

  it("не берёт слова, которым срок ещё не наступил", () => {
    const fresh = reviewWord(createWordState("w-0", nowMs - DAY), "remembered", nowMs);
    expect(dueWordStates([fresh], nowMs)).toEqual([]);
  });

  it("при одинаковом сроке сортирует по id — порядок предсказуем", () => {
    const states = [createWordState("w-b", nowMs - DAY), createWordState("w-a", nowMs - DAY)];
    expect(dueWordStates(states, nowMs).map((state) => state.wordId)).toEqual(["w-a", "w-b"]);
  });

  it("узнаёт оценки кнопок сада", () => {
    expect(isGardenGrade("remembered")).toBe(true);
    expect(isGardenGrade("hinted")).toBe(true);
    expect(isGardenGrade("forgotten")).toBe(true);
    expect(isGardenGrade("не помню")).toBe(false);
  });
});

describe("проверка ответа по типам упражнений", () => {
  it("say-back и echo-sound принимают кнопку «Я сказал!»", () => {
    const sayBack: Exercise = { type: "say-back", wordId: book.id };
    const echo: Exercise = { type: "echo-sound", wordId: book.id, focusSound: "th" };
    expect(checkAnswer(sayBack, SAID_ANSWER).correct).toBe(true);
    expect(checkAnswer(echo, SAID_ANSWER).correct).toBe(true);
    expect(checkAnswer(sayBack, "ааа").resolved).toBe(false);
  });

  it("read-freeze: и выбор картинки, и сборка из букв", () => {
    const pick: Exercise = { type: "read-freeze", wordId: book.id, mode: "pick" };
    const letters: Exercise = { type: "read-freeze", wordId: book.id, mode: "letters" };
    expect(checkAnswer(pick, book.id).correct).toBe(true);
    expect(checkAnswer(pick, apple.id).correct).toBe(false);
    expect(checkAnswer(letters, ["b", "o", "o", "k"], wordsById).correct).toBe(true);
    expect(checkAnswer(letters, ["k", "o", "o", "b"], wordsById).correct).toBe(false);
  });

  it("quick-match: порядок картинок должен совпасть с порядком слов", () => {
    const match: Exercise = { type: "quick-match", wordIds: [book.id, apple.id, plain.id] };
    expect(checkAnswer(match, `${book.id},${apple.id},${plain.id}`).correct).toBe(true);
    expect(checkAnswer(match, `${apple.id},${book.id},${plain.id}`).correct).toBe(false);
    expect(checkAnswer(match, `${book.id},${apple.id}`).resolved).toBe(false);
  });

  it("build-phrase без каталога не «засчитывается молча»", () => {
    const phrase: Exercise = { type: "build-phrase", wordId: iCanJump.id };
    expect(checkAnswer(phrase, ["a", "b"]).resolved).toBe(false);
    expect(checkAnswer(phrase, "склеенное слово", wordsById).resolved).toBe(false);
  });

  it("сборка из букв без каталога тоже ждёт данных, а не гадает", () => {
    const letters: Exercise = { type: "read-freeze", wordId: book.id, mode: "letters" };
    expect(checkAnswer(letters, ["b", "o", "o", "k"]).resolved).toBe(false);
    expect(checkAnswer(letters, "book", wordsById).resolved).toBe(false);
  });

  it("собирает слова упражнения для прогресса и реакций", () => {
    expect(wordIdsOf(listenPick)).toEqual([book.id, apple.id, plain.id]);
    expect(wordIdsOf({ type: "quick-match", wordIds: [book.id, apple.id, plain.id] })).toEqual([
      book.id,
      apple.id,
      plain.id,
    ]);
    expect(wordIdsOf({ type: "say-back", wordId: book.id })).toEqual([book.id]);
    expect(targetWordId({ type: "garden-water", wordIds: [book.id, apple.id] })).toBe(book.id);
  });
});

describe("детерминированный генератор", () => {
  it("одинаковый сид даёт одинаковую последовательность", () => {
    const first = Array.from({ length: 5 }, createRng(seedFrom("mnd-q1-library")));
    const second = Array.from({ length: 5 }, createRng(seedFrom("mnd-q1-library")));
    expect(first).toEqual(second);
  });

  it("разные сиды дают разные последовательности", () => {
    const a = Array.from({ length: 5 }, createRng(seedFrom("a")));
    const b = Array.from({ length: 5 }, createRng(seedFrom("b")));
    expect(a).not.toEqual(b);
  });

  it("тасовка не теряет и не дублирует элементы", () => {
    const items = [1, 2, 3, 4, 5];
    const shuffled = shuffle(items, createRng(seedFrom("day-3")));
    expect([...shuffled].sort()).toEqual(items);
  });
});
