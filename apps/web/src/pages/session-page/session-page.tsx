/**
 * Страница поручения: экран сессии и возврат на карту (task.md RF-3).
 * Искры тратятся один раз на вход в квест и не тратятся повторно при перерисовке.
 */

import { Button, Panel } from "@tw/ui";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SessionRunner, type SessionSummary } from "../../components/exercise/session-runner";
import { questOf } from "../../lib/catalog";
import {
  useDayRecord,
  useLiveWordCount,
  usePatchDay,
  useSpendSparks,
  useToday,
  useWordStates,
} from "../../lib/queries";
import { now } from "../../lib/time";
import styles from "./session-page.module.css";

export const SessionPage = () => {
  const params = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const day = useToday();
  const nowMs = now();
  const quest = questOf(params.questId ?? "");
  const patchDay = usePatchDay();
  const record = useDayRecord(day);
  const live = useLiveWordCount();
  const states = useWordStates();
  const [spent, setSpent] = useState(false);

  const { mutate: spendSparks } = useSpendSparks();

  useEffect(() => {
    if (!quest || spent) {
      return;
    }
    setSpent(true);
    spendSparks(day);
    // Искры тратятся один раз на вход в квест.
  }, [day, quest, spent, spendSparks]);

  const onFinish = (summary: SessionSummary): void => {
    void patchDay.mutateAsync({
      day,
      patch: (current) => ({
        ...current,
        tasksDone: Math.min(4, current.tasksDone + 1),
        questIds: quest ? [...new Set([...current.questIds, quest.id])] : current.questIds,
        newWordIds: [...new Set([...current.newWordIds, ...summary.wordIds])],
        xpGained: current.xpGained + summary.xp,
        crystalsGained: current.crystalsGained + summary.crystals,
      }),
    });
    void live.refetch();
    void states.refetch();
    navigate("/");
  };

  if (!quest) {
    return (
      <main className={styles.page}>
        <Panel className={styles.missing}>
          <p>Такого поручения в мире пока нет.</p>
          <Button onClick={() => navigate("/")}>Назад к карте</Button>
        </Panel>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <button type="button" className={styles.back} onClick={() => navigate("/")}>
        ← Карта
      </button>
      <p className={styles.sparks}>Искры сегодня: {record.data?.sparksLeft ?? 0}</p>
      <SessionRunner questId={quest.id} nowMs={nowMs} onFinish={onFinish} />
    </main>
  );
};
