/**
 * Пузырь Паймон на карте: одна-две реплики дня из банка, тап — озвучить
 * (task.md RF-2.3). Текст живёт в контенте, здесь только выбор реплики дня.
 */

import { cn, ElementalAura } from "@tw/ui";
import type { ReactNode } from "react";
import { catalog, companionOf, mediaSrc } from "../../lib/catalog";
import { pickLine } from "../../lib/random-line";
import { useAudio } from "../../providers/app-providers";
import styles from "./paimon-bubble.module.css";

export type PaimonBubbleProps = {
  /** Ключ дня: реплики не прыгают при перерисовке и не повторяются за день. */
  readonly seed: string;
  readonly lines?: readonly string[];
  readonly onTap?: () => void;
  readonly className?: string;
  readonly children?: ReactNode;
};

const paimon = companionOf("paimon");

export const PaimonBubble = ({ seed, lines, onTap, className, children }: PaimonBubbleProps) => {
  const { speak } = useAudio();
  const pool = lines ?? catalog.paimonBank.dayOpen;
  const line = pickLine(pool, seed);
  const portrait = mediaSrc(paimon?.media.portrait);

  return (
    <div className={cn(styles.shell, className)}>
      <ElementalAura element="anemo" density="lite" />
      {portrait ? <img className={styles.avatar} src={portrait} alt="" /> : null}
      <button
        type="button"
        className={styles.bubble}
        onClick={() => {
          speak(line);
          onTap?.();
        }}
      >
        <span className={styles.text}>{line}</span>
        {children}
      </button>
    </div>
  );
};
