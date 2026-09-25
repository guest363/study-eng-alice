/**
 * quick-match: соедини слово с картинкой (task.md RF-4.6). Без таймера и штрафов:
 * неверная пара — это «почти», а не ошибка.
 */

import { Button, cn, Kicker } from "@tw/ui";
import { useState } from "react";
import { catalog, mediaSrc, wordsById } from "../../lib/catalog";
import { useAudio } from "../../providers/app-providers";
import styles from "./quick-match.module.css";

export type QuickMatchProps = {
  readonly wordIds: readonly string[];
  readonly hintsUsed: number;
  readonly answerShown: boolean;
  readonly onAnswer: (pairs: string) => void;
  readonly onShowAnswer: () => void;
};

export const QuickMatch = ({
  wordIds,
  hintsUsed,
  answerShown,
  onAnswer,
  onShowAnswer,
}: QuickMatchProps) => {
  const { speak } = useAudio();
  const labels = catalog.labels.exercise.quickMatch;
  const [pickedWord, setPickedWord] = useState<string | null>(null);
  const [pairs, setPairs] = useState<string[]>([]);

  const words = wordIds.map((id) => wordsById.get(id)).filter((word) => word !== undefined);

  const pairWith = (imageId: string): void => {
    if (!pickedWord) {
      return;
    }
    const next = [...pairs, `${pickedWord}:${imageId}`];
    setPairs(next);
    setPickedWord(null);
    if (next.length === words.length) {
      onAnswer(next.join(","));
    }
  };

  return (
    <section className={styles.exercise}>
      <Kicker>{labels.prompt}</Kicker>
      <p className={styles.hint}>{labels.hint}</p>
      <div className={styles.columns}>
        <ul className={styles.column}>
          {words.map((word) => (
            <li key={word.id}>
              <button
                type="button"
                className={cn(styles.tile, pickedWord === word.id && styles.picked)}
                onClick={() => {
                  speak(word.en);
                  setPickedWord(word.id);
                }}
                disabled={answerShown}
              >
                {word.en}
              </button>
            </li>
          ))}
        </ul>
        <ul className={styles.column}>
          {words.map((word) => {
            const src = mediaSrc(word.media.icon);
            const paired = pairs.some((pair) => pair.endsWith(`:${word.id}`));
            return (
              <li key={word.id}>
                <button
                  type="button"
                  className={cn(styles.tile, styles.picture, paired && styles.paired)}
                  onClick={() => pairWith(word.id)}
                  disabled={answerShown || !pickedWord}
                  aria-label={word.ru}
                >
                  {src ? (
                    <img src={src} alt="" />
                  ) : (
                    <span aria-hidden="true">{word.emoji ?? "🔤"}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {hintsUsed > 0 ? <p className={styles.hint}>{catalog.labels.feedback.almost}</p> : null}
      {answerShown ? (
        <p className={styles.shown}>{catalog.labels.feedback.shown}</p>
      ) : (
        <Button variant="ghost" onClick={onShowAnswer}>
          {catalog.labels.actions.showAnswer}
        </Button>
      )}
    </section>
  );
};
