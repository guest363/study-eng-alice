/**
 * Отряд: спутники-наставники, стихия и уровень (task.md RF-6.1).
 * Открывается по завершённым темам, без рандома и без валюты.
 */

import { Kicker, Panel, StatPill } from "@tw/ui";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { catalog, mediaSrc } from "../../lib/catalog";
import { useInventory, useToday, useWordStates } from "../../lib/queries";
import styles from "./party-page.module.css";

export const PartyPage = () => {
  const navigate = useNavigate();
  const day = useToday();
  const states = useWordStates();
  const inventory = useInventory();

  const levels = useMemo(() => {
    const count = new Map<string, number>();
    for (const state of states.data ?? []) {
      if (state.live) {
        count.set(state.wordId, state.successfulReps);
      }
    }
    return count;
  }, [states.data]);

  const learned = (states.data ?? []).filter((state) => state.live).length;

  return (
    <main className={styles.page}>
      <button type="button" className={styles.back} onClick={() => navigate("/")}>
        ← Карта
      </button>
      <Kicker>Отряд Хранителей Слов</Kicker>
      <StatPill label="Оживших слов" value={learned} tone="frost" />
      <ul className={styles.roster}>
        {catalog.companions.map((companion) => {
          const src = mediaSrc(companion.media.portrait) ?? mediaSrc(companion.media.icon);
          const opened = companion.id === "paimon" || levels.size > 0;
          return (
            <li key={companion.id}>
              <Panel className={opened ? styles.card : styles.cardLocked}>
                {src ? <img className={styles.portrait} src={src} alt="" /> : null}
                <div className={styles.body}>
                  <p className={styles.name}>{opened ? companion.nameRu : "???"}</p>
                  <p className={styles.role}>
                    {opened ? companion.roleRu : "Спутник ещё не присоединился"}
                  </p>
                  {opened ? <p className={styles.praise}>{companion.praise[0]}</p> : null}
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>
      <p className={styles.day}>День: {day}</p>
      <p className={styles.crystals}>Кристаллы: {inventory.data?.crystals ?? 0}</p>
    </main>
  );
};
