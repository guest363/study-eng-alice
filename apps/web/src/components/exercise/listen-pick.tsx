/**
 * listen-pick: «услышала слово — выбери картинку» (task.md RF-4.2).
 * Логика и подписи приходят из @tw/core и контента — компонент только рисует.
 */
import { buildListenPickOptions } from "@tw/core";
import { Button, cn, Kicker } from "@tw/ui";
import { useMemo } from "react";
import { catalog, mediaSrc, wordsById } from "../../lib/catalog";
import styles from "./listen-pick.module.css";

export type ListenPickProps = {
  readonly wordId: string;
  readonly distractorIds: readonly string[];
  readonly hintsUsed: number;
  readonly answerShown: boolean;
  readonly onAnswer: (wordId: string) => void;
  readonly onReplay: () => void;
  readonly onShowAnswer: () => void;
};

export const ListenPick = ({
  wordId,
  distractorIds,
  hintsUsed,
  answerShown,
  onAnswer,
  onReplay,
  onShowAnswer,
}: ListenPickProps) => {
  const labels = catalog.labels.exercise.listenPick;
  const word = wordsById.get(wordId);
  const options = useMemo(
    () =>
      buildListenPickOptions(
        { type: "listen-pick", wordId, distractorIds: [...distractorIds] },
        wordsById,
      ),
    [distractorIds, wordId],
  );

  return (
    <section className={styles.exercise}>
      <Kicker>{labels.prompt}</Kicker>
      <div className={styles.prompt}>
        <Button
          className={styles.speaker}
          onClick={onReplay}
          aria-label={catalog.labels.actions.replay}
        >
          🔊
        </Button>
        {hintsUsed > 0 ? <p className={styles.hint}>{labels.hint}</p> : null}
      </div>
      <ul className={styles.options}>
        {options.map((option) => {
          const target = wordsById.get(option.wordId);
          const src = mediaSrc(target?.media.icon);
          return (
            <li key={option.wordId}>
              <button
                type="button"
                className={cn(styles.option, answerShown && option.correct && styles.correct)}
                onClick={() => onAnswer(option.wordId)}
                disabled={answerShown}
                aria-label={
                  option.isEmoji ? `Вариант ${option.wordId}` : (target?.ru ?? option.wordId)
                }
              >
                {src ? (
                  <img className={styles.optionImage} src={src} alt="" />
                ) : (
                  <span className={styles.optionEmoji} aria-hidden="true">
                    {option.label}
                  </span>
                )}
                <span className={styles.optionLabel}>{target?.ru ?? ""}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {answerShown ? (
        <p className={styles.support}>
          {catalog.labels.feedback.shown} ({word?.en})
        </p>
      ) : (
        <Button variant="ghost" onClick={onShowAnswer}>
          {catalog.labels.actions.showAnswer}
        </Button>
      )}
    </section>
  );
};
