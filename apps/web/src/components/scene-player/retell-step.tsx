/**
 * Пересказ: расставить карточки-сцены в правильном порядке (task.md RF-8.2).
 * Неверный порядок — это не «ошибка», а «Паймон запуталась — попробуем ещё»,
 * верный — озвучка всей истории целиком.
 */

import type { Quest } from "@tw/core";
import { createRng, seedFrom, shuffle } from "@tw/core";
import { Button, Kicker, Panel } from "@tw/ui";
import { useMemo, useState } from "react";
import { catalog } from "../../lib/catalog";
import { useAudio } from "../../providers/app-providers";
import styles from "./retell-step.module.css";

export type RetellStepProps = {
  readonly quest: Quest;
  readonly sceneIds: readonly string[];
  readonly onDone: () => void;
};

const sceneOf = (quest: Quest, sceneId: string) => {
  for (const step of quest.steps) {
    if (step.kind === "scene" && step.scene.id === sceneId) {
      return step.scene;
    }
  }
  return null;
};

const captionOf = (quest: Quest, sceneId: string): string => {
  const scene = sceneOf(quest, sceneId);
  return scene?.beats[0]?.textRu ?? "";
};

export const RetellStep = ({ quest, sceneIds, onDone }: RetellStepProps) => {
  const { speak } = useAudio();
  const [order, setOrder] = useState<string[]>([...sceneIds]);
  const [checked, setChecked] = useState<"none" | "almost" | "done">("none");
  const shuffled = useMemo(
    () => shuffle(sceneIds, createRng(seedFrom(`${quest.id}:retell`))),
    [quest.id, sceneIds],
  );

  const check = (): void => {
    const same = order.every((id, index) => id === sceneIds[index]);
    if (same) {
      setChecked("done");
      speak(captionOf(quest, sceneIds[sceneIds.length - 1] ?? ""));
      return;
    }
    setChecked("almost");
  };

  return (
    <Panel className={styles.panel}>
      <Kicker>{catalog.paimonBank.choice[0] ?? ""}</Kicker>
      <ul className={styles.cards}>
        {(checked === "done" ? order : shuffled).map((sceneId, index) => (
          <li key={sceneId} className={styles.card}>
            <span className={styles.number}>{index + 1}</span>
            <span className={styles.caption}>{captionOf(quest, sceneId)}</span>
            {checked === "none" ? (
              <span className={styles.swap}>
                <button
                  type="button"
                  className={styles.move}
                  disabled={index === 0}
                  onClick={() =>
                    setOrder((current) => {
                      const next = [...current];
                      const target = order.indexOf(sceneId);
                      const moved = next.splice(target, 1)[0];
                      if (moved) {
                        next.splice(target - 1, 0, moved);
                      }
                      return next;
                    })
                  }
                  aria-label="Выше"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.move}
                  disabled={index === order.length - 1}
                  onClick={() =>
                    setOrder((current) => {
                      const next = [...current];
                      const target = order.indexOf(sceneId);
                      const moved = next.splice(target, 1)[0];
                      if (moved) {
                        next.splice(target + 1, 0, moved);
                      }
                      return next;
                    })
                  }
                  aria-label="Ниже"
                >
                  ↓
                </button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {checked === "almost" ? (
        <p className={styles.almost}>{catalog.labels.feedback.almost}</p>
      ) : null}
      {checked === "done" ? (
        <>
          <p className={styles.done}>{catalog.labels.feedback.correct}</p>
          <Button onClick={onDone}>{catalog.labels.actions.next}</Button>
        </>
      ) : (
        <Button onClick={check}>{catalog.labels.actions.check}</Button>
      )}
    </Panel>
  );
};
