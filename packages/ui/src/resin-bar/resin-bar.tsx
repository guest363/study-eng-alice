/**
 * Полоска искр озарения — дневной запас энергии (task.md §4.5). Без чисел-оценок.
 * Разметка нативная: <progress> с подписью, чтобы скринридер читал запас, а не «див», а не «див».
 */
import { DAILY_SPARKS_CAP, SPARKS_PER_TASK } from "@tw/core";
import { cn } from "../cn/cn";
import styles from "./resin-bar.module.css";

export type ResinBarProps = {
  readonly sparksLeft: number;
  /** Сколько искр стоит одно поручение — по этому считаем, на сколько поручений хватит. */
  readonly perTask?: number;
  readonly label?: string;
  readonly className?: string;
};

export const ResinBar = ({
  sparksLeft,
  perTask = SPARKS_PER_TASK,
  label = "Искры озарения",
  className,
}: ResinBarProps) => {
  const filled = Math.max(0, Math.min(DAILY_SPARKS_CAP, sparksLeft));
  const tasksLeft = Math.floor(filled / perTask);
  return (
    <div className={cn(styles.shell, className)}>
      <span className={styles.label}>{label}</span>
      <progress
        className={styles.track}
        max={DAILY_SPARKS_CAP}
        value={filled}
        aria-label={`${label}: хватит на ${tasksLeft} поручений`}
      />
      <span className={styles.count}>
        {filled} / {DAILY_SPARKS_CAP}
      </span>
    </div>
  );
};
