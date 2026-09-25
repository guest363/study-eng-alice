/**
 * Экран сессии — один квест (task.md RF-3): сцена → упражнения → сундук →
 * клиффхэнгер. Всегда заканчивается успехом, ошибка не штрафуется (RF-3.2).
 *
 * Прогресс пишется в IndexedDB после каждого шага, поэтому выход на середине
 * и возврат работают (RF-3.4). Логика ответов — в @tw/core, здесь только рисуем.
 */
import {
  type Chest,
  createExerciseRun,
  currentState,
  ELEMENTS,
  type ExerciseRun,
  MAX_HINTS,
  nextExercise,
  type QuestStep,
  SAID_ANSWER,
  type SrsGrade,
  showAnswer,
  submitAnswer,
  summarizeRun,
  type WordState,
  wordIdsOf,
} from "@tw/core";
import { Button, ChestOverlay, cn, Kicker, Panel } from "@tw/ui";
import { useEffect, useMemo, useState } from "react";
import { catalog, companionOf, mediaSrc, questsById, wordsById } from "../../lib/catalog";
import { useAddInventory, usePlantWord, useReviewWord, useWordStates } from "../../lib/queries";
import { useAudio } from "../../providers/app-providers";
import { RetellStep } from "../scene-player/retell-step";
import { ScenePlayer } from "../scene-player/scene-player";
import { BuildPhrase } from "./build-phrase";
import { GardenWater } from "./garden-water";
import { ListenPick } from "./listen-pick";
import { QuickMatch } from "./quick-match";
import { ReadFreeze } from "./read-freeze";
import { SayBack } from "./say-back";
import styles from "./session-runner.module.css";

export type SessionSummary = {
  readonly xp: number;
  readonly crystals: number;
  readonly wordIds: readonly string[];
  readonly goToGarden: readonly string[];
};

export type SessionRunnerProps = {
  readonly questId: string;
  readonly nowMs: number;
  readonly onFinish: (summary: SessionSummary) => void;
};

const INTRO = -1;

export const SessionRunner = ({ questId, nowMs, onFinish }: SessionRunnerProps) => {
  const { speak } = useAudio();
  const quest = questsById.get(questId) ?? null;
  const steps = useMemo(() => (quest ? quest.steps : []), [quest]);
  const wordStates = useWordStates();
  const review = useReviewWord();
  const { mutate: plantWord } = usePlantWord();
  const addInventory = useAddInventory();

  const [index, setIndex] = useState(INTRO);
  const [run, setRun] = useState<ExerciseRun | null>(null);
  const [summary, setSummary] = useState<SessionSummary>({
    xp: 0,
    crystals: 0,
    wordIds: [],
    goToGarden: [],
  });
  const [finished, setFinished] = useState(false);

  const statesById = useMemo(
    () => new Map((wordStates.data ?? []).map((state) => [state.wordId, state])),
    [wordStates.data],
  );

  // Слова квеста попадают в сад сразу как ростки: их нельзя «потерять» из-за выхода.
  const unknownWordIds = useMemo(
    () => (quest ? questWordIds(quest.steps).filter((id) => !statesById.has(id)) : []),
    [quest, statesById],
  );

  useEffect(() => {
    for (const wordId of unknownWordIds) {
      plantWord({ wordId, nowMs });
    }
  }, [nowMs, plantWord, unknownWordIds]);

  if (!quest) {
    return (
      <Panel className={styles.panel}>
        <Kicker>Такого поручения нет</Kicker>
      </Panel>
    );
  }

  const step = index >= 0 ? steps[index] : undefined;

  const goNext = (): void => {
    const next = index + 1;
    if (next >= steps.length) {
      setIndex(steps.length);
      return;
    }
    setIndex(next);
    setRun(null);
  };

  const startStep = (nextIndex: number): void => {
    const nextStep = steps[nextIndex];
    if (nextStep?.kind === "exercises") {
      setRun(createExerciseRun(nextStep.items, `${quest.id}#${nextIndex}`));
    }
    setIndex(nextIndex);
  };

  const awardXp = (delta: number): void => {
    if (delta > 0) {
      setSummary((current) => ({ ...current, xp: current.xp + delta }));
    }
  };

  const answer = (value: Parameters<typeof submitAnswer>[1]): void => {
    if (!run) {
      return;
    }
    const before = summarizeRun(run);
    const next = submitAnswer(run, value, wordsById);
    setRun(next);
    const after = summarizeRun(next);
    awardXp(after.xp - before.xp);
    const settled = next.items[next.index];
    if (next.status === "resolved" && settled) {
      const result = next.results[next.index];
      setSummary((current) => ({
        ...current,
        wordIds: [...new Set([...current.wordIds, ...wordIdsOf(settled)])],
        goToGarden: [...new Set([...current.goToGarden, ...(result?.goToGarden ?? [])])],
      }));
    }
  };

  const reveal = (): void => {
    if (!run) {
      return;
    }
    setRun(showAnswer(run));
  };

  const gardenReview = (wordId: string, grade: SrsGrade): void => {
    void review.mutateAsync({ wordId, grade, nowMs });
    setSummary((current) => ({ ...current, wordIds: [...new Set([...current.wordIds, wordId])] }));
  };

  const finish = (): void => {
    setFinished(true);
    if (summary.xp > 0) {
      void addInventory.mutateAsync({ crystals: summary.crystals });
    }
    onFinish(summary);
  };

  if (finished) {
    return (
      <Panel className={cn(styles.panel, styles.end)}>
        <Kicker>{quest.titleRu}</Kicker>
        <h2 className={styles.endTitle}>
          {quest.cliffhangerRu ?? catalog.labels.session.cliffhangerPrompt}
        </h2>
        <p className={styles.support}>{catalog.paimonBank.cliffhanger[0] ?? ""}</p>
        <Button onClick={finish}>{catalog.labels.actions.next}</Button>
      </Panel>
    );
  }

  if (index === INTRO) {
    return (
      <Panel className={styles.panel}>
        <Kicker>{catalog.labels.session.intro}</Kicker>
        <h2 className={styles.title}>{quest.titleRu}</h2>
        {quest.element ? <Kicker>{elementLabel(quest.element)}</Kicker> : null}
        <div className={styles.actions}>
          <Button
            onClick={() => {
              speak(quest.titleRu, { slow: true });
              startStep(0);
            }}
          >
            {catalog.labels.session.continueLabel}
          </Button>
        </div>
      </Panel>
    );
  }

  if (!step) {
    return (
      <Panel className={cn(styles.panel, styles.end)}>
        <Kicker>{quest.titleRu}</Kicker>
        <h2 className={styles.endTitle}>
          {quest.cliffhangerRu ?? catalog.labels.session.cliffhangerPrompt}
        </h2>
        <p className={styles.support}>{catalog.paimonBank.cliffhanger[0] ?? ""}</p>
        <div className={styles.actions}>
          <Button onClick={finish}>{catalog.labels.actions.next}</Button>
        </div>
      </Panel>
    );
  }

  if (step.kind === "scene") {
    return (
      <div className={styles.panel}>
        <ScenePlayer key={step.scene.id} scene={step.scene} onDone={goNext} />
      </div>
    );
  }

  if (step.kind === "retell") {
    return <RetellStep quest={quest} sceneIds={step.sceneIds} onDone={goNext} />;
  }

  if (step.kind === "reward") {
    return (
      <ChestOverlay
        chest={step.chest}
        title={catalog.labels.chest[step.chest]}
        items={chestItems(step.chest, summary)}
        crystals={summary.crystals}
        onOpen={() => undefined}
        onClose={goNext}
      />
    );
  }

  // Блок упражнений.
  const activeRun = run;
  const exercise = activeRun?.items[activeRun.index];
  if (!activeRun || !exercise) {
    return null;
  }
  const mentor = companionOf(step.mentorId);
  const state = currentState(activeRun);
  const common = {
    hintsUsed: state.hintsUsed,
    answerShown: state.answerShown,
  };

  return (
    <Panel className={styles.panel}>
      <div className={styles.mentorRow}>
        {mentor && mediaSrc(mentor.media.icon) ? (
          <img className={styles.mentorIcon} src={mediaSrc(mentor.media.icon) ?? ""} alt="" />
        ) : null}
        <Kicker>{step.titleRu}</Kicker>
        <span className={styles.hintCount}>{MAX_HINTS - state.hintsUsed}</span>
      </div>
      <div className={styles.exerciseBody}>
        {exercise.type === "garden-water" ? (
          <GardenWater
            states={gardenStates(exercise.wordIds, statesById, nowMs)}
            finished={state.status === "resolved"}
            onReview={gardenReview}
            onFinish={goNext}
          />
        ) : exercise.type === "listen-pick" ? (
          <ListenPick
            {...common}
            wordId={exercise.wordId}
            distractorIds={exercise.distractorIds}
            onAnswer={answer}
            onReplay={() => speak(wordsById.get(exercise.wordId)?.en ?? "", { slow: true })}
            onShowAnswer={reveal}
          />
        ) : exercise.type === "build-phrase" ? (
          <BuildPhrase
            {...common}
            wordId={exercise.wordId}
            seed={`${quest.id}#${index}-${activeRun.index}`}
            onAnswer={answer}
            onReplay={() => speak(wordsById.get(exercise.wordId)?.en ?? "")}
          />
        ) : exercise.type === "say-back" ? (
          <SayBack
            {...common}
            wordId={exercise.wordId}
            onAnswer={() => answer(SAID_ANSWER)}
            onShowAnswer={reveal}
          />
        ) : exercise.type === "echo-sound" ? (
          <SayBack
            {...common}
            wordId={exercise.wordId}
            focusSound={exercise.focusSound}
            onAnswer={() => answer(SAID_ANSWER)}
            onShowAnswer={reveal}
          />
        ) : exercise.type === "quick-match" ? (
          <QuickMatch
            {...common}
            wordIds={exercise.wordIds}
            onAnswer={answer}
            onShowAnswer={reveal}
          />
        ) : (
          <ReadFreeze
            {...common}
            wordId={exercise.wordId}
            mode={exercise.mode}
            onAnswer={answer}
            onShowAnswer={reveal}
          />
        )}
      </div>
      {state.status === "resolved" ? (
        <div className={styles.actions}>
          <Button
            onClick={() =>
              isLastItem(activeRun, step) ? goNext() : setRun(nextExercise(activeRun))
            }
          >
            {catalog.labels.actions.next}
          </Button>
        </div>
      ) : null}
    </Panel>
  );
};

const isLastItem = (run: ExerciseRun, step: QuestStep): boolean =>
  step.kind === "exercises" && run.index >= step.items.length - 1;

/** Название стихии — доменная константа (ELEMENTS), не текст контента. */
const elementLabel = (element: string): string =>
  ELEMENTS.find((item) => item.id === element)?.labelRu ?? element;

const questWordIds = (steps: readonly QuestStep[]): string[] => {
  const ids = new Set<string>();
  for (const step of steps) {
    if (step.kind !== "exercises") {
      continue;
    }
    for (const exercise of step.items) {
      for (const id of wordIdsOf(exercise)) {
        ids.add(id);
      }
    }
  }
  return [...ids];
};

/** Состояния для сада: реальные из базы, а для новых слов — только что посаженные. */
const gardenStates = (
  wordIds: readonly string[],
  statesById: ReadonlyMap<string, WordState>,
  nowMs: number,
): WordState[] =>
  wordIds.map((wordId) => {
    const state = statesById.get(wordId);
    if (state) {
      return state;
    }
    return {
      wordId,
      stability: 0,
      difficulty: 3,
      dueAt: new Date(nowMs).toISOString(),
      reps: 0,
      lapses: 0,
      successfulReps: 0,
      live: false,
      starProtectedUntil: null,
      firstSeenAt: new Date(nowMs).toISOString(),
      lastReviewedAt: null,
    };
  });

const chestItems = (
  chest: Chest,
  summary: SessionSummary,
): readonly { id: string; label: string; note?: string }[] => {
  const items: { id: string; label: string; note?: string }[] = [];
  const card = summary.wordIds[summary.wordIds.length - 1];
  if (card) {
    const word = wordsById.get(card);
    items.push({
      id: `card-${card}`,
      label: `${catalog.labels.chest.wordCard}: ${word?.en ?? card}`,
      note: word?.ru,
    });
  }
  items.push({ id: "xp", label: `+${summary.xp}`, note: "опыт" });
  if (chest !== "common") {
    items.push({ id: "scroll", label: catalog.labels.chest.scroll });
  }
  return items;
};
