/**
 * Родительский уголок (заглушка гейта G3): детский замок арифметикой и тёплое
 * приветствие. Отчёт и настройки приходят в G7 (task.md RF-11).
 */

import { Button, Kicker, Panel } from "@tw/ui";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./parent-page.module.css";

/** Пример на вход: ребёнок не решает случайно, родитель — легко (RF-11.1). */
const makeExample = (day: string): { left: number; right: number; answer: number } => {
  const seed = day.split("-").reduce((sum, part) => sum + Number(part), 0);
  const left = 12 + (seed % 7);
  const right = 3 + (seed % 5);
  return { left, right, answer: left + right };
};

export const ParentPage = () => {
  const navigate = useNavigate();
  const day = new Date().toISOString().slice(0, 10);
  const example = useMemo(() => makeExample(day), [day]);
  const [value, setValue] = useState("");
  const [opened, setOpened] = useState(false);

  if (!opened) {
    return (
      <main className={styles.page}>
        <Panel className={styles.lock}>
          <Kicker>Для взрослых</Kicker>
          <p className={styles.hint}>Реши пример, чтобы открыть дневник Хранителя.</p>
          <p className={styles.example}>
            {example.left} + {example.right} = ?
          </p>
          <input
            className={styles.input}
            inputMode="numeric"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-label="Ответ примера"
          />
          <Button onClick={() => setOpened(Number(value) === example.answer)}>Открыть</Button>
        </Panel>
        <button type="button" className={styles.back} onClick={() => navigate("/")}>
          ← Карта
        </button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Panel className={styles.lock}>
        <Kicker>Дневник Хранителя</Kicker>
        <p className={styles.hint}>
          Ваша роль — радоваться вместе. Пропущенные дни — не проблема: слова никуда не делись.
        </p>
        <Button variant="ghost" onClick={() => setOpened(false)}>
          Закрыть
        </Button>
      </Panel>
      <button type="button" className={styles.back} onClick={() => navigate("/")}>
        ← Карта
      </button>
    </main>
  );
};
