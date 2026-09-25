/**
 * «Как играть?» — повторное обучение по кнопке в шапке (task.md RF-1.2).
 * Правила дня и сада, без оценок и терминов.
 */

import { Button, Kicker, Panel } from "@tw/ui";
import { useNavigate } from "react-router-dom";
import { catalog } from "../../lib/catalog";
import styles from "./how-to-play-page.module.css";

export const HowToPlayPage = () => {
  const navigate = useNavigate();
  const paimon = companionLines();
  return (
    <main className={styles.page}>
      <Kicker>Как играть</Kicker>
      <Panel className={styles.card}>
        <p>{paimon}</p>
        <ul className={styles.list}>
          <li>Каждый день — четыре поручения, каждое стоит 10 искр из 40.</li>
          <li>Слова, которые давно не видели, попадают в сад: их достаточно полить.</li>
          <li>Не уверена — говори «Подскажи», это не ошибка, а часть игры.</li>
          <li>Не успела за день — ничего не теряется: искры не копятся в долг.</li>
        </ul>
        <Button onClick={() => navigate("/")}>{catalog.labels.actions.next}</Button>
      </Panel>
    </main>
  );
};

const companionLines = (): string =>
  catalog.paimonBank.dayOpen[0] ?? "Путешественница, слова ждут тебя!";
