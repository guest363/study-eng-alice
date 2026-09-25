/**
 * garden-water: поливаем слова сада (task.md RF-4.7, RF-5.1).
 * Три кнопки — три честных ответа; ни одна не называется «неправильно».
 */
import type { SrsGrade, WordState } from "@tw/core";
import { Button, cn, Kicker, Plant, WordCard } from "@tw/ui";
import { useState } from "react";
import { catalog, wordsById } from "../../lib/catalog";
import { useAudio } from "../../providers/app-providers";
import styles from "./garden-water.module.css";

export type GardenWaterProps = {
  readonly states: readonly WordState[];
  readonly onReview: (wordId: string, grade: SrsGrade) => void;
  readonly onFinish: () => void;
  readonly finished: boolean;
};

export const GardenWater = ({ states, onReview, onFinish, finished }: GardenWaterProps) => {
  const { speak } = useAudio();
  const labels = catalog.labels;
  const [index, setIndex] = useState(0);
  const [watered, setWatered] = useState<string[]>([]);
  const state = states[index];

  if (!state) {
    return (
      <section className={styles.exercise}>
        <Kicker>{labels.exercise.gardenWater.prompt}</Kicker>
        <p className={styles.support}>{labels.garden.empty}</p>
        <Button onClick={onFinish}>{labels.actions.next}</Button>
      </section>
    );
  }

  const word = wordsById.get(state.wordId);

  const review = (grade: SrsGrade): void => {
    onReview(state.wordId, grade);
    setWatered((previous) => [...previous, state.wordId]);
    setIndex((current) => current + 1);
  };

  return (
    <section className={styles.exercise}>
      <Kicker>{labels.exercise.gardenWater.prompt}</Kicker>
      <div className={styles.progress} aria-live="polite">
        <Plant
          stage={finished ? "flower" : "bud"}
          word={word?.en ?? state.wordId}
          protectedWord={Boolean(state.starProtectedUntil)}
        />
      </div>
      <WordCard
        en={word?.en ?? state.wordId}
        ru={word?.ru ?? ""}
        emoji={word?.emoji}
        example={word?.example}
        element={word?.element}
        stage="bud"
        onSpeak={() => speak(word?.en ?? "", { slow: true })}
      />
      <div className={styles.actions}>
        <Button onClick={() => review("remembered")}>{labels.srsGrade.remembered}</Button>
        <Button variant="ghost" onClick={() => review("hinted")}>
          {labels.srsGrade.hinted}
        </Button>
        <Button variant="ghost" onClick={() => review("forgotten")}>
          {labels.srsGrade.forgotten}
        </Button>
      </div>
      {watered.length > 0 ? (
        <p className={cn(styles.support)}>{labels.exercise.gardenWater.hint}</p>
      ) : null}
    </section>
  );
};
