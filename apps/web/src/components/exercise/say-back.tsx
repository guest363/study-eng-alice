/**
 * say-back и echo-sound: «повтори за наставником» (task.md RF-4.3, RF-4.4).
 *
 * Произношение не оценивается (RF-4.9): ребёнок нажимает «Я сказал!», наставник
 * хвалит. Самозапись появляется только если браузер умеет писать звук — иначе
 * кнопка записи молча не показывается.
 */

import { createVoiceRecorder, type RecorderState } from "@tw/media";
import { Button, Kicker, WordCard } from "@tw/ui";
import { useEffect, useRef, useState } from "react";
import { catalog, wordsById } from "../../lib/catalog";
import { useAudio } from "../../providers/app-providers";
import styles from "./say-back.module.css";

export type SayBackProps = {
  readonly wordId: string;
  /** Для echo-sound: изолированный звук, который повторяют (RF-4.4). */
  readonly focusSound?: string;
  readonly hintsUsed: number;
  readonly answerShown: boolean;
  readonly onAnswer: () => void;
  readonly onShowAnswer: () => void;
};

export const SayBack = ({
  wordId,
  focusSound,
  hintsUsed,
  answerShown,
  onAnswer,
  onShowAnswer,
}: SayBackProps) => {
  const { speak } = useAudio();
  const recorderRef = useRef(createVoiceRecorder());
  const [state, setState] = useState<RecorderState>(() => recorderRef.current.getState());
  const [url, setUrl] = useState<string | null>(null);
  const word = wordsById.get(wordId);
  const labels = focusSound ? catalog.labels.exercise.echoSound : catalog.labels.exercise.sayBack;
  const spoken = focusSound ?? word?.en ?? "";

  useEffect(() => {
    // Микрофон спрашиваем один раз: без разрешения кнопка записи не показывается.
    void recorderRef.current.start();
  }, []);

  return (
    <section className={styles.exercise}>
      <Kicker>{labels.prompt}</Kicker>
      {focusSound ? <p className={styles.sound}>{focusSound}</p> : null}
      <div className={styles.actions}>
        <Button onClick={() => speak(spoken, { slow: true })}>
          {catalog.labels.actions.replay}
        </Button>
        <Button variant="ghost" onClick={() => speak(spoken)}>
          {catalog.labels.actions.normalVoice}
        </Button>
      </div>
      <WordCard
        en={word?.en ?? ""}
        ru={word?.ru ?? ""}
        emoji={word?.emoji}
        example={word?.example}
      />
      {hintsUsed > 0 ? <p className={styles.hint}>{labels.hint}</p> : null}
      {answerShown ? (
        <p className={styles.shown}>{catalog.labels.feedback.shown}</p>
      ) : (
        <div className={styles.actions}>
          {recorderRef.current.isSupported() ? (
            <RecorderBlock
              state={state}
              url={url}
              onRecord={async () => {
                await recorderRef.current.start();
                setState(recorderRef.current.getState());
              }}
              onStop={() => {
                recorderRef.current.stop();
                setState(recorderRef.current.getState());
                setUrl(recorderRef.current.getUrl());
              }}
            />
          ) : null}
          <Button onClick={onAnswer}>{catalog.labels.actions.said}</Button>
          <Button variant="ghost" onClick={onShowAnswer}>
            {catalog.labels.actions.showAnswer}
          </Button>
        </div>
      )}
    </section>
  );
};

/** Кнопки самозаписи: записать, остановить, послушать себя. */
const RecorderBlock = ({
  state,
  url,
  onRecord,
  onStop,
}: {
  readonly state: RecorderState;
  readonly url: string | null;
  readonly onRecord: () => Promise<void>;
  readonly onStop: () => void;
}) => (
  <div className={styles.recorder}>
    {state === "recording" ? (
      <Button onClick={onStop}>{catalog.labels.actions.stop}</Button>
    ) : (
      <Button variant="ghost" onClick={() => void onRecord()}>
        {catalog.labels.actions.record}
      </Button>
    )}
    {url ? (
      <audio className={styles.self} controls src={url}>
        <track kind="captions" />
      </audio>
    ) : null}
  </div>
);
