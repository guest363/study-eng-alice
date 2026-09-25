/**
 * Сундук награды (task.md RF-9.1): содержимое объявляется ДО открытия, дубликаты
 * превращаются в кристаллы. Никакого лутбокса и никакого рандома.
 */

import type { Chest } from "@tw/core";
import { useEffect, useState } from "react";
import { Button } from "../button/button";
import { cn } from "../cn/cn";
import { Kicker } from "../kicker/kicker";
import styles from "./chest-overlay.module.css";

export type ChestItem = Readonly<{ id: string; label: string; note?: string }>;

export type ChestOverlayProps = {
  readonly chest: Chest;
  /** Подпись сундука из контента. */
  readonly title: string;
  /** Объявленное содержимое: ребёнок видит его до нажатия. */
  readonly items: readonly ChestItem[];
  /** Сколько кристаллов начислили за дубликаты. */
  readonly crystals?: number;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly className?: string;
};

const OPEN_MS = 900;

export const ChestOverlay = ({
  chest,
  title,
  items,
  crystals = 0,
  onOpen,
  onClose,
  className,
}: ChestOverlayProps) => {
  const [state, setState] = useState<"preview" | "opening" | "opened">("preview");

  useEffect(() => {
    if (state !== "opening") {
      return;
    }
    const timer = window.setTimeout(() => setState("opened"), OPEN_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  // Анимация внутри компонента, а onOpen оповещает экран, что награда выдана.
  const startOpening = (): void => {
    setState("opening");
    onOpen();
  };

  return (
    <div className={cn(styles.backdrop, className)} role="dialog" aria-modal="true">
      <div className={cn(styles.chest, styles[chest], styles[state])}>
        <Kicker>{state === "preview" ? "Содержимое объявлено заранее" : "Открыто"}</Kicker>
        <h2 className={styles.title}>{title}</h2>
        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <span className={styles.itemLabel}>{item.label}</span>
              {item.note ? <span className={styles.itemNote}>{item.note}</span> : null}
            </li>
          ))}
          {crystals > 0 ? (
            <li className={styles.item}>
              <span className={styles.itemLabel}>Кристаллы за дубликаты</span>
              <span className={styles.itemNote}>+{crystals}</span>
            </li>
          ) : null}
        </ul>
        <div className={styles.actions}>
          {state === "preview" ? <Button onClick={startOpening}>Открыть</Button> : null}
          {state === "opened" ? <Button onClick={onClose}>Забрать</Button> : null}
        </div>
      </div>
    </div>
  );
};
