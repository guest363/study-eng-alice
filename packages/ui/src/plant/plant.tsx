/** Растение сада слов: росток → бутон → цветок, звезда памяти поверх (RF-5.2). */
import type { PlantStage } from "@tw/core";
import { cn } from "../cn/cn";
import styles from "./plant.module.css";

export type PlantProps = {
  readonly stage: PlantStage;
  readonly word: string;
  readonly protectedWord?: boolean;
  readonly onClick?: () => void;
  readonly className?: string;
};

const GLYPHS: Record<PlantStage, string> = {
  sprout: "🌱",
  bud: "🌿",
  flower: "🌸",
};

export const Plant = ({ stage, word, protectedWord = false, onClick, className }: PlantProps) => {
  const content = (
    <>
      <span className={styles.glyph} data-stage={stage} aria-hidden="true">
        {GLYPHS[stage]}
      </span>
      <span className={styles.word}>{word}</span>
      {protectedWord ? <span className={styles.star}>★</span> : null}
    </>
  );
  if (!onClick) {
    return <div className={cn(styles.plant, styles[stage], className)}>{content}</div>;
  }
  return (
    <button type="button" className={cn(styles.plant, styles[stage], className)} onClick={onClick}>
      {content}
    </button>
  );
};
