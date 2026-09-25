/**
 * Карта Тейвата: открытые регионы — цветные, закрытые — «под Безмолвием»
 * (task.md RF-2.1). Позиции и подписи приходят пропсами: карта — это контент,
 * а не код компонента.
 *
 * Разметка: SVG-подложка + обычные <button> поверх. Так хит-зоны настоящие
 * (≥48px), клавиатура работает сама, а скринридер читает «кнопка», а не «картинка».
 */
import type { ElementId } from "@tw/core";
import { cn } from "../cn/cn";
import styles from "./region-map.module.css";

export type MapNode = Readonly<{
  id: string;
  label: string;
  order: number;
  element: ElementId;
  /** Открыт ли регион: всё, что не первый, открывается после предыдущего. */
  opened: boolean;
  /** 0…1 — доля выученных слов региона. */
  progress: number;
}>;

export type RegionMapProps = {
  readonly nodes: readonly MapNode[];
  readonly onSelect: (id: string) => void;
  readonly className?: string;
};

/** Круг по центру: узлы раскладываются по кольцу, угол зависит от порядка региона. */
const nodePosition = (order: number): { left: string; top: string } => {
  const angle = ((order - 1) / 7) * Math.PI * 2 - Math.PI / 2;
  return {
    left: `${50 + Math.cos(angle) * 34}%`,
    top: `${50 + Math.sin(angle) * 44}%`,
  };
};

export const RegionMap = ({ nodes, onSelect, className }: RegionMapProps) => (
  <div className={cn(styles.shell, className)}>
    <svg
      className={styles.map}
      viewBox="0 0 320 420"
      role="presentation"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="tw-fog" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgb(154 168 194 / 22%)" />
          <stop offset="100%" stopColor="rgb(154 168 194 / 0%)" />
        </radialGradient>
      </defs>
      <path
        className={styles.land}
        d="M92 12c34 8 62-6 92 4 26 9 18 34 30 52 12 18 42 20 48 48 6 27-18 40-22 62-4 21 12 40-4 58-17 20-44 6-66 16-22 10-34 40-60 34-26-6-28-38-46-54-18-16-48-18-52-46-4-27 24-42 30-64 6-21-14-44 6-62 15-14 34-4 46-22 8-13 4-28 0-40Z"
      />
    </svg>
    <ul className={styles.nodes}>
      {nodes.map((node) => {
        const position = nodePosition(node.order);
        const percent = Math.round(node.progress * 100);
        return (
          <li key={node.id} className={styles.slot} style={position}>
            <button
              type="button"
              className={cn(styles.node, styles[node.element], !node.opened && styles.locked)}
              onClick={() => onSelect(node.id)}
              disabled={!node.opened}
              aria-label={node.opened ? node.label : `${node.label}: под Безмолвием`}
            >
              <span className={styles.disc} aria-hidden="true">
                {node.opened ? node.order : "?"}
              </span>
              <span className={styles.caption}>{node.opened ? node.label : "под Безмолвием"}</span>
              {node.opened && percent > 0 ? (
                <span className={styles.progress} aria-hidden="true">
                  <span className={styles.progressFill} style={{ width: `${percent}%` }} />
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  </div>
);
