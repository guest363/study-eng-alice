/** Карточка поручения (комиссии) на карте и в хабе региона (task.md RF-2.4). */

import type { ElementId } from "@tw/core";
import type { ReactNode } from "react";
import { cn } from "../cn/cn";
import { Kicker } from "../kicker/kicker";
import styles from "./quest-card.module.css";

export type QuestCardProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly element: ElementId;
  readonly kicker?: string;
  readonly done?: boolean;
  readonly disabled?: boolean;
  readonly onClick?: () => void;
  readonly children?: ReactNode;
  readonly className?: string;
};

export const QuestCard = ({
  title,
  subtitle,
  element,
  kicker,
  done = false,
  disabled = false,
  onClick,
  children,
  className,
}: QuestCardProps) => {
  const content = (
    <>
      <Kicker>{kicker ?? (done ? "Готово" : "Поручение")}</Kicker>
      <h3 className={styles.title}>{title}</h3>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      {children}
    </>
  );

  if (!onClick) {
    return (
      <article className={cn(styles.card, styles[element], done && styles.done, className)}>
        {content}
      </article>
    );
  }

  return (
    <button
      type="button"
      className={cn(styles.card, styles[element], styles.clickable, done && styles.done, className)}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
};
