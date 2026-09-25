import { SPARKS_PER_TASK } from "@tw/core";
import { Button, Kicker, Panel } from "@tw/ui";
import styles from "./map-page.module.css";

export const MapPage = () => (
  <main className={styles.page}>
    <Panel className={styles.hero}>
      <Kicker>Великое Безмолвие</Kicker>
      <h1 className={styles.title}>Слова Тейвата потеряли голос</h1>
      <p className={styles.lead}>
        Паймон и Ноэлль ждут Путешественницу. Карта мира расцветёт здесь после гейта G3 — а
        фундамент уже стоит: за каждое поручение дня расходуются искры, {SPARKS_PER_TASK} из сорока.
      </p>
      <div className={styles.actions}>
        <Button disabled>Скоро: начать день</Button>
        <Button variant="ghost">Как играть?</Button>
      </div>
    </Panel>
  </main>
);
