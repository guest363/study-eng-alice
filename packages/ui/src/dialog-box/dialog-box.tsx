/**
 * Диалог наставника: портрет + русский текст + озвучка английской части
 * (task.md RF-8.1). Текст приходит из контента, компонент ничего не знает про сюжет.
 */
import type { ReactNode } from "react";
import { cn } from "../cn/cn";
import { Kicker } from "../kicker/kicker";
import styles from "./dialog-box.module.css";

export type DialogSpeaker = Readonly<{
  name: string;
  /** Ключ портрета в медиа-манифесте; null — рисуем заглушку. */
  portraitKey?: string | null;
  elementId?: string;
}>;

export type DialogBoxProps = {
  readonly speaker: DialogSpeaker;
  readonly children: ReactNode;
  /** Английская часть реплики: озвучивается по кнопке. */
  readonly english?: string | null;
  readonly onSpeak?: () => void;
  readonly kicker?: string;
  readonly className?: string;
};

export const DialogBox = ({
  speaker,
  children,
  english,
  onSpeak,
  kicker,
  className,
}: DialogBoxProps) => (
  <section className={cn(styles.shell, className)}>
    <div className={cn(styles.portrait, speaker.elementId ? styles[speaker.elementId] : undefined)}>
      {speaker.portraitKey ? (
        <img className={styles.portraitImage} src={speaker.portraitKey} alt={speaker.name} />
      ) : (
        <span className={styles.portraitFallback} aria-hidden="true">
          {speaker.name.slice(0, 1)}
        </span>
      )}
    </div>
    <div className={styles.body}>
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <p className={styles.name}>{speaker.name}</p>
      <p className={styles.text}>{children}</p>
      {english ? (
        <div className={styles.englishRow}>
          <span className={styles.english}>{english}</span>
          {onSpeak ? (
            <button
              type="button"
              className={styles.speak}
              onClick={onSpeak}
              aria-label="Послушать английскую реплику"
            >
              🔊
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  </section>
);
