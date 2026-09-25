/**
 * read-freeze: прочитай слово и выбери картинку, либо собери слово из букв-льдинок
 * (task.md RF-4.8). Буквы озвучиваются по тапу, собранное слово — целиком.
 */

import { createRng, seedFrom, shuffle } from "@tw/core";
import { Button, cn, Kicker } from "@tw/ui";
import { useState } from "react";
import { catalog, mediaSrc, wordsById } from "../../lib/catalog";
import { useAudio } from "../../providers/app-providers";
import styles from "./read-freeze.module.css";

export type ReadFreezeProps = {
  readonly wordId: string;
  readonly mode: "pick" | "letters";
  readonly hintsUsed: number;
  readonly answerShown: boolean;
  readonly onAnswer: (answer: string | string[]) => void;
  readonly onShowAnswer: () => void;
};

export const ReadFreeze = ({
  wordId,
  mode,
  hintsUsed,
  answerShown,
  onAnswer,
  onShowAnswer,
}: ReadFreezeProps) => {
  const { speak } = useAudio();
  const word = wordsById.get(wordId);
  const labels = catalog.labels.exercise.readFreeze;
  const [picked, setPicked] = useState<string[]>([]);

  if (!word) {
    return null;
  }

  if (mode === "pick") {
    const options = shuffle(
      [word, ...pickDistractors(word.id)],
      createRng(seedFrom(`${word.id}:read-freeze`)),
    ).filter((option): option is NonNullable<typeof option> => option !== undefined);
    return (
      <section className={styles.exercise}>
        <Kicker>{labels.prompt}</Kicker>
        <p className={styles.word}>{word.en}</p>
        <ul className={styles.options}>
          {options.map((option) => {
            const src = mediaSrc(option.media.icon);
            return (
              <li key={option.id}>
                <button
                  type="button"
                  className={styles.option}
                  onClick={() => onAnswer(option.id)}
                  disabled={answerShown}
                  aria-label={option.ru}
                >
                  {src ? (
                    <img src={src} alt="" />
                  ) : (
                    <span aria-hidden="true">{option.emoji ?? "🔤"}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {hintsUsed > 0 ? <p className={styles.hint}>{labels.hint}</p> : null}
        {answerShown ? (
          <p className={styles.shown}>{catalog.labels.feedback.shown}</p>
        ) : (
          <Button variant="ghost" onClick={onShowAnswer}>
            {catalog.labels.actions.showAnswer}
          </Button>
        )}
      </section>
    );
  }

  // Повторяющиеся буквы получают разные id через счётчик вхождений, а не через индекс массива.
  const seen = new Map<string, number>();
  const tiles = shuffle(
    word.en.split("").map((letter) => {
      const count = seen.get(letter) ?? 0;
      seen.set(letter, count + 1);
      return { id: `${letter}-${count}`, letter };
    }),
    createRng(seedFrom(`${word.id}:letters`)),
  );

  return (
    <section className={styles.exercise}>
      <Kicker>{labels.lettersPrompt}</Kicker>
      <p className={styles.hint}>{labels.hint}</p>
      <p className={styles.word} aria-live="polite">
        {picked.join("")}
      </p>
      <ul className={styles.ice}>
        {tiles.map((tile, index) => {
          const used = index < picked.length;
          return (
            <li key={tile.id}>
              <button
                type="button"
                className={cn(styles.iceBlock, used && styles.used)}
                onClick={() => {
                  speak(tile.letter);
                  const next = [...picked, tile.letter];
                  setPicked(next);
                  if (next.length === tiles.length) {
                    onAnswer(next);
                  }
                }}
                disabled={answerShown || used}
              >
                {tile.letter}
              </button>
            </li>
          );
        })}
      </ul>
      {hintsUsed > 0 ? <p className={styles.hint}>{labels.hint}</p> : null}
      {answerShown ? (
        <>
          <p className={styles.shown}>{catalog.labels.feedback.shown}</p>
          <Button onClick={() => speak(word.en)}>{catalog.labels.actions.replay}</Button>
        </>
      ) : (
        <Button variant="ghost" onClick={onShowAnswer}>
          {catalog.labels.actions.showAnswer}
        </Button>
      )}
    </section>
  );
};

/** Соседние по id слова региона — правдоподобные distractors для режима «выбери картинку». */
const pickDistractors = (wordId: string): ReturnType<typeof wordsById.get>[] => {
  const all = [...wordsById.values()];
  const index = all.findIndex((word) => word.id === wordId);
  const next = all[(index + 1) % all.length];
  const after = all[(index + 2) % all.length];
  return [next, after].filter((word) => word !== undefined);
};
