/** Пилюля-показатель в шапке: ранг, счётчик слов, кристаллы. Только информация. */
import type { ReactNode } from "react";
import { cn } from "../cn/cn";
import styles from "./stat-pill.module.css";

export type StatPillProps = {
  readonly label: string;
  readonly value: ReactNode;
  readonly tone?: "gilt" | "frost" | "mist";
  readonly className?: string;
};

export const StatPill = ({ label, value, tone = "gilt", className }: StatPillProps) => (
  <span className={cn(styles.pill, styles[tone], className)}>
    <span className={styles.label}>{label}</span>
    <span className={styles.value}>{value}</span>
  </span>
);
