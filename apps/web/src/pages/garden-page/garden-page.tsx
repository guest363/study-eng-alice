/**
 * Сад слов: растения по стадиям, просроченные «хотят пить» (task.md RF-5.2).
 * Здесь же — полив: три кнопки, ни одна не называется «неправильно».
 */

import type { SrsGrade, WordState } from "@tw/core";
import { Button, Kicker, Panel, Plant, WordCard } from "@tw/ui";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { catalog, wordsById } from "../../lib/catalog";
import { useReviewWord, useToday, useWordStates } from "../../lib/queries";
import { now } from "../../lib/time";
import { useAudio } from "../../providers/app-providers";
import styles from "./garden-page.module.css";

export const GardenPage = () => {
  const navigate = useNavigate();
  const { speak } = useAudio();
  const nowMs = now();
  const day = useToday();
  const states = useWordStates();
  const review = useReviewWord();
  const [picked, setPicked] = useState<string | null>(null);

  const due = useMemo(
    () => (states.data ?? []).filter((state) => Date.parse(state.dueAt) <= nowMs),
    [nowMs, states.data],
  );
  const current = due.find((state) => state.wordId === picked) ?? due[0] ?? null;

  const water = (grade: SrsGrade): void => {
    if (!current) {
      return;
    }
    void review.mutateAsync({ wordId: current.wordId, grade, nowMs });
    setPicked(null);
  };

  return (
    <main className={styles.page}>
      <button type="button" className={styles.back} onClick={() => navigate("/")}>
        ← Карта
      </button>
      <Kicker>Сад слов</Kicker>
      {current ? (
        <Panel className={styles.panel}>
          <WordCard
            en={wordsById.get(current.wordId)?.en ?? current.wordId}
            ru={wordsById.get(current.wordId)?.ru ?? ""}
            emoji={wordsById.get(current.wordId)?.emoji}
            stage="bud"
            onSpeak={() => speak(wordsById.get(current.wordId)?.en ?? "", { slow: true })}
          />
          <div className={styles.actions}>
            <Button onClick={() => water("remembered")}>
              {catalog.labels.srsGrade.remembered}
            </Button>
            <Button variant="ghost" onClick={() => water("hinted")}>
              {catalog.labels.srsGrade.hinted}
            </Button>
            <Button variant="ghost" onClick={() => water("forgotten")}>
              {catalog.labels.srsGrade.forgotten}
            </Button>
          </div>
        </Panel>
      ) : (
        <Panel className={styles.panel}>
          <p>{catalog.labels.garden.empty}</p>
        </Panel>
      )}
      <section className={styles.garden}>
        <Kicker>{catalog.labels.garden.due}</Kicker>
        <ul className={styles.plants}>
          {(states.data ?? []).map((state) => (
            <li key={state.wordId}>
              <PlantButton state={state} onPick={setPicked} />
            </li>
          ))}
        </ul>
      </section>
      <p className={styles.day}>День: {day}</p>
    </main>
  );
};

const PlantButton = ({
  state,
  onPick,
}: {
  readonly state: WordState;
  readonly onPick: (wordId: string) => void;
}) => (
  <Plant
    stage={state.live ? "flower" : state.successfulReps >= 1 ? "bud" : "sprout"}
    word={wordsById.get(state.wordId)?.en ?? state.wordId}
    protectedWord={Boolean(state.starProtectedUntil)}
    onClick={() => onPick(state.wordId)}
  />
);
