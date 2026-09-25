/**
 * Карта мира — главный экран дня (task.md RF-2): пузырь Паймон, четыре поручения
 * прямо на карте, прогресс регионов. Здесь же — экран отдыха, когда искры кончились.
 */

import { DAILY_SPARKS_CAP, type ElementId, SPARKS_PER_TASK } from "@tw/core";
import {
  Button,
  Kicker,
  type MapNode,
  Panel,
  QuestCard,
  RegionMap,
  ResinBar,
  StatPill,
} from "@tw/ui";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PaimonBubble } from "../../components/paimon-bubble";
import { RestScreen } from "../../components/rest-screen";
import { catalog, orderedRegions, regionOf, regionWords } from "../../lib/catalog";
import {
  useDayPlan,
  useDayRecord,
  useLiveWordCount,
  useToday,
  useWordStates,
} from "../../lib/queries";
import { now } from "../../lib/time";
import styles from "./map-page.module.css";

export const MapPage = () => {
  const navigate = useNavigate();
  const day = useToday();
  const nowMs = now();
  const plan = useDayPlan(day, nowMs);
  const record = useDayRecord(day);
  const live = useLiveWordCount();
  const states = useWordStates();
  const [restVisible, setRestVisible] = useState(false);

  const sparksLeft = record.data?.sparksLeft ?? DAILY_SPARKS_CAP;
  const totalWords = catalog.words.length;

  const nodes = useMemo<MapNode[]>(
    () =>
      orderedRegions.map((region, index) => {
        const words = regionWords(region.id);
        const wordIds = new Set(words.map((word) => word.id));
        const learned = (states.data ?? []).filter(
          (state) => wordIds.has(state.wordId) && state.reps > 0,
        ).length;
        return {
          id: region.id,
          label: region.nameRu,
          order: region.order,
          element: (region.elementAccent ?? "anemo") as ElementId,
          opened: index === 0,
          progress: words.length === 0 ? 0 : learned / words.length,
        };
      }),
    [states.data],
  );

  if (restVisible || plan.data?.status === "closed") {
    return (
      <main className={styles.page}>
        <RestScreen day={day} onBack={() => setRestVisible(false)} />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.top}>
        <PaimonBubble seed={`${day}:open`} />
        <div className={styles.stats}>
          <StatPill label="Ранг" value={`AR${1}`} />
          <StatPill label="Слова ожили" value={`${live.data ?? 0} из ${totalWords}`} tone="frost" />
          <ResinBar sparksLeft={sparksLeft} className={styles.resin} />
        </div>
      </section>

      <section className={styles.map}>
        <RegionMap
          nodes={nodes}
          onSelect={(id) => {
            const region = regionOf(id);
            if (region) {
              navigate(`/region/${region.slug}`);
            }
          }}
        />
      </section>

      <section className={styles.tasks}>
        <Kicker>Поручения дня</Kicker>
        {(plan.data?.tasks ?? []).map((task) => {
          const done = task.questId ? (record.data?.questIds ?? []).includes(task.questId) : false;
          return (
            <QuestCard
              key={task.id}
              title={task.titleRu}
              element={task.element}
              done={done}
              disabled={sparksLeft < SPARKS_PER_TASK}
              kicker={
                task.kind === "garden"
                  ? "Сад слов"
                  : task.kind === "elemental"
                    ? "Стихия дня"
                    : "Поручение"
              }
              onClick={() => {
                if (task.questId) {
                  navigate(`/session/${task.questId}`);
                  return;
                }
                navigate("/garden");
              }}
            >
              <p className={styles.taskWords}>
                {task.wordIds.length > 0
                  ? `слов в поручении: ${task.wordIds.length}`
                  : "искры кончились на сегодня"}
              </p>
            </QuestCard>
          );
        })}
      </section>

      <Panel className={styles.hint}>
        <Kicker>Как играть</Kicker>
        <p className={styles.hintText}>
          Каждое поручение стоит {SPARKS_PER_TASK} искр. Не успела — ничего не теряется, слова ждут
          в саду.
        </p>
        <Button variant="ghost" onClick={() => navigate("/how-to-play")}>
          Подробнее
        </Button>
      </Panel>
    </main>
  );
};
