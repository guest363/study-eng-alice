/**
 * Сцена квеста: реплики по очереди, портрет, озвучка английской части (task.md RF-8.1).
 * Тексты приходят из контента, компонент ничего не придумывает. Сброс на первую реплику
 * делает вызывающий через key={scene.id}.
 */
import type { Scene } from "@tw/core";
import { Button, DialogBox, ElementalAura, Panel } from "@tw/ui";
import { useEffect, useState } from "react";
import { companionOf, mediaSrc } from "../../lib/catalog";
import { useAudio } from "../../providers/app-providers";
import styles from "./scene-player.module.css";

export type ScenePlayerProps = {
  readonly scene: Scene;
  readonly onDone: () => void;
  readonly onSpeak?: (text: string) => void;
  readonly nextLabel?: string;
};

const speakerName = (speakerId: string): string => {
  if (speakerId === "narrator") {
    return "Рассказчик";
  }
  return companionOf(speakerId)?.nameRu ?? "Паймон";
};

export const ScenePlayer = ({ scene, onDone, onSpeak, nextLabel }: ScenePlayerProps) => {
  const { speak } = useAudio();
  const [index, setIndex] = useState(0);
  const beat = scene.beats[index];
  const isLast = index === scene.beats.length - 1;

  const spokenEn = beat?.speakEn ? (beat.textEn ?? "") : "";
  useEffect(() => {
    if (spokenEn) {
      speak(spokenEn, { slow: true });
    }
    // Озвучка реплики — один раз на появление, а не на каждый рендер.
  }, [spokenEn, speak]);

  if (!beat) {
    return null;
  }

  const companion = companionOf(beat.speakerId);

  return (
    <Panel className={styles.scene}>
      <ElementalAura element={companion?.element ?? "anemo"} density="lite" />
      <DialogBox
        speaker={{
          name: speakerName(beat.speakerId),
          portraitKey: mediaSrc(companion?.media.portrait),
          elementId: companion?.element,
        }}
        english={beat.textEn}
        onSpeak={() => {
          if (beat.textEn) {
            (onSpeak ?? ((text: string) => speak(text)))(beat.textEn);
          }
        }}
      >
        {beat.textRu}
      </DialogBox>
      <Button
        onClick={() => {
          if (isLast) {
            onDone();
            return;
          }
          setIndex((current) => current + 1);
        }}
      >
        {isLast ? (nextLabel ?? "Дальше") : "Дальше"}
      </Button>
    </Panel>
  );
};
