/**
 * Хаб региона: квесты, наставник, звёзды темы и прогресс слов (task.md RF-2.5).
 */

import { DAILY_SPARKS_CAP, SPARKS_PER_TASK } from "@tw/core";
import { Kicker, Panel, QuestCard, ResinBar, StatPill, WordCard } from "@tw/ui";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PaimonBubble } from "../../components/paimon-bubble";
import { catalog, companionOf, mediaSrc, regionQuests, regionWords } from "../../lib/catalog";
import { useDayRecord, useToday, useWordStates } from "../../lib/queries";
import { now } from "../../lib/time";
import styles from "./region-page.module.css";

export const RegionPage = () => {
  const params = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const day = useToday();
  const nowMs = now();
  const region = useMemo(
    () => catalog.regions.find((item) => item.slug === params.slug) ?? catalog.regions[0] ?? null,
    [params.slug],
  );
  const states = useWordStates();
  const record = useDayRecord(day);

  if (!region) {
    return null;
  }

  const words = regionWords(region.id);
  const quests = regionQuests(region.id);
  const wordIds = new Set(words.map((word) => word.id));
  const learned = (states.data ?? []).filter(
    (state) => wordIds.has(state.wordId) && state.reps > 0,
  );
  const due = (states.data ?? []).filter(
    (state) => wordIds.has(state.wordId) && Date.parse(state.dueAt) <= nowMs,
  );
  const mentor = companionOf(region.mentors[0] ?? "");
  const sparksLeft = record.data?.sparksLeft ?? DAILY_SPARKS_CAP;

  return (
    <main className={styles.page}>
      <button type="button" className={styles.back} onClick={() => navigate("/")}>
        ← Карта
      </button>
      <PaimonBubble seed={`${region.id}:region`} />

      <Panel className={styles.hero}>
        <Kicker>{region.subtitleRu}</Kicker>
        <h1 className={styles.title}>{region.nameRu}</h1>
        <p className={styles.story}>{region.storyRu}</p>
        <div className={styles.stats}>
          <StatPill label="Слов" value={`${learned.length} из ${words.length}`} tone="frost" />
          <StatPill label="Хотят пить" value={due.length} tone="mist" />
          <ResinBar sparksLeft={sparksLeft} className={styles.resin} />
        </div>
      </Panel>

      {mentor ? (
        <Panel className={styles.mentor}>
          {mediaSrc(mentor.media.portrait) ? (
            <img className={styles.portrait} src={mediaSrc(mentor.media.portrait) ?? ""} alt="" />
          ) : null}
          <div>
            <Kicker>Наставник</Kicker>
            <p className={styles.mentorName}>{mentor.nameRu}</p>
            <p className={styles.mentorRole}>{mentor.roleRu}</p>
          </div>
        </Panel>
      ) : null}

      <section className={styles.quests}>
        <Kicker>Поручения региона</Kicker>
        {quests.map((quest) => (
          <QuestCard
            key={quest.id}
            title={quest.titleRu}
            subtitle={quest.cliffhangerRu}
            element={quest.element ?? "anemo"}
            kicker={quest.kind === "archon" ? "Архонтский квест" : "Поручение"}
            disabled={sparksLeft < SPARKS_PER_TASK}
            onClick={() => navigate(`/session/${quest.id}`)}
          />
        ))}
      </section>

      <section className={styles.words}>
        <Kicker>Слова региона</Kicker>
        <ul className={styles.wordList}>
          {words.slice(0, 12).map((word) => (
            <li key={word.id}>
              <WordCard
                en={word.en}
                ru={word.ru}
                emoji={word.emoji}
                example={word.example}
                element={word.element}
                imageSrc={mediaSrc(word.media.icon)}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};
