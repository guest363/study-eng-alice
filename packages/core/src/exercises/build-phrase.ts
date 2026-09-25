/**
 * build-phrase — «собери фразу из слов-блоков» (task.md RF-4.5). Логика без UI:
 * блоки, их порядок и проверка собранного. Тасование детерминированное: одна и та же
 * фраза в один и тот же день всегда приходит одинаково.
 */
import type { Word } from "../contracts";
import { createRng, seedFrom, shuffle } from "../random";

export type PhraseBlock = Readonly<{
  id: string;
  /** Слово блока: "thank", "you". */
  text: string;
  /** Полная фраза — для озвучки блока по тапу. */
  spoken: string;
}>;

/** Слово-фраза режется на блоки; «I can jump» → ["I", "can", "jump"]. */
export const phraseBlocks = (word: Word): PhraseBlock[] =>
  word.en
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map((part, index) => ({
      id: `${word.id}-${index}`,
      text: part,
      spoken: part,
    }));

/**
 * Порядок блоков для показа: детерминированная тасовка от seed строки.
 * Однословные фразы не тасуются — их нечего собирать.
 */
export const shuffledBlocks = (word: Word, seed: string): PhraseBlock[] => {
  const blocks = phraseBlocks(word);
  if (blocks.length < 2) {
    return blocks;
  }
  return shuffle(blocks, createRng(seedFrom(`${seed}:${word.id}`)));
};

/** Собрана ли фраза правильно: сравниваем порядок блоков с эталоном. */
export const isPhraseCorrect = (word: Word, answerBlockIds: readonly string[]): boolean => {
  const expected = phraseBlocks(word).map((block) => block.id);
  return (
    expected.length === answerBlockIds.length &&
    expected.every((id, index) => id === answerBlockIds[index])
  );
};
