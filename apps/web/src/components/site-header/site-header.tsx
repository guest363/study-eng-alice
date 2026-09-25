/**
 * Шапка-пилюля: ранг Хранителя, счётчик слов и искры (task.md RF-2.2).
 * Данные — из локальной базы, никакой аналитики (NFR-1).
 */

import { DAILY_SPARKS_CAP, ELEMENTS, rankByXp } from "@tw/core";
import { cn, Kicker, ResinBar, StatPill } from "@tw/ui";
import { NavLink } from "react-router-dom";
import { catalog } from "../../lib/catalog";
import { useDayRecord, useLiveWordCount, useSettings, useToday } from "../../lib/queries";
import styles from "./site-header.module.css";

export const SiteHeader = () => {
  const day = useToday();
  const record = useDayRecord(day);
  const live = useLiveWordCount();
  const settings = useSettings();
  const xp = record.data?.xpGained ?? 0;
  const total = catalog.words.length;

  return (
    <header className={styles.shell}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Kicker>Хранители Слов</Kicker>
          <span className={styles.title}>{settings.data?.travelerName ?? "Путешественница"}</span>
        </div>
        <div className={styles.stats}>
          <StatPill label="Ранг" value={`AR${rankByXp(xp)}`} />
          <StatPill label="Слова" value={`${live.data ?? 0} из ${total}`} tone="frost" />
          <ResinBar
            sparksLeft={record.data?.sparksLeft ?? DAILY_SPARKS_CAP}
            className={styles.resin}
          />
        </div>
      </div>
      <nav className={styles.nav} aria-label="Разделы">
        <NavLink to="/" className={({ isActive }) => cn(styles.link, isActive && styles.active)}>
          Карта
        </NavLink>
        <NavLink
          to="/garden"
          className={({ isActive }) => cn(styles.link, isActive && styles.active)}
        >
          Сад слов
        </NavLink>
        <NavLink
          to="/party"
          className={({ isActive }) => cn(styles.link, isActive && styles.active)}
        >
          Отряд
        </NavLink>
        <NavLink
          to="/parent"
          className={({ isActive }) => cn(styles.link, isActive && styles.active)}
        >
          Родителям
        </NavLink>
        <NavLink
          to="/how-to-play"
          className={({ isActive }) => cn(styles.link, isActive && styles.active)}
        >
          Как играть?
        </NavLink>
      </nav>
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
};
