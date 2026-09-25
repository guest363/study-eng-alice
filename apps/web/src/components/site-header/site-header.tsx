import { DAILY_SPARKS_CAP, ELEMENTS } from "@tw/core";
import { cn, Kicker } from "@tw/ui";
import styles from "./site-header.module.css";

export const SiteHeader = () => (
  <header className={styles.shell}>
    <div className={styles.inner}>
      <div className={styles.brand}>
        <Kicker>Тейват ждёт</Kicker>
        <span className={styles.title}>Хранители Слов</span>
      </div>
      <div className={styles.stats}>
        <span className={styles.sparks}>
          Искры {DAILY_SPARKS_CAP}/{DAILY_SPARKS_CAP}
        </span>
        <span className={styles.words}>Слова: 0</span>
      </div>
    </div>
    <div className={styles.elements} aria-hidden="true">
      {ELEMENTS.map((element) => (
        <span
          key={element.id}
          className={cn(styles.dot, styles[element.id])}
          title={element.labelRu}
        />
      ))}
    </div>
  </header>
);
