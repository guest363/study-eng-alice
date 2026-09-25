/**
 * Хуки данных поверх репозиториев @tw/db (task.md §8.3): компоненты читают прогресс
 * через useQuery и пишут через useMutation с инвалидацией. В useState прогресса нет.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buildDayPlan,
  createWordState,
  DAILY_SPARKS_CAP,
  type DayPlan,
  type DayRecord,
  dayKeyOf,
  plantStage,
  reviewWord,
  type SessionRecord,
  type SrsGrade,
  sessionRecordSchema,
  type WordState,
} from "@tw/core";
import {
  appendJournal,
  countLiveWords,
  dayKeys,
  finishSession,
  getDb,
  type Inventory,
  inventoryKeys,
  journalKeys,
  listJournalBetween,
  listJournalByDay,
  readAllWordStates,
  readDay,
  readDueWordStates,
  readInventory,
  readOpenSession,
  readSettings,
  reviewStoredWord,
  saveSessionProgress,
  sessionKeys,
  settingsKeys,
  spendSparks,
  startSession,
  updateDay,
  wordStateKeys,
  writeInventory,
  writeWordState,
} from "@tw/db";
import { useCallback } from "react";
import { catalog, orderedRegions, regionQuests } from "./catalog";
import { today } from "./time";

/** Регион, который сейчас открыт: первый, чьи квесты ещё не пройдены. */
export const currentRegionId = (): string => orderedRegions[0]?.id ?? "mondstadt";

export const useToday = (): string => today();

export const useDayRecord = (day: string) =>
  useQuery({
    queryKey: dayKeys.day(day),
    queryFn: async () => (await readDay(getDb(), day)) ?? null,
  });

export const useWordStates = () =>
  useQuery({
    queryKey: wordStateKeys.allWords(),
    queryFn: () => readAllWordStates(getDb()),
  });

export const useDueWords = (nowMs: number) =>
  useQuery({
    queryKey: wordStateKeys.due(nowMs),
    queryFn: () => readDueWordStates(getDb(), nowMs),
  });

export const useLiveWordCount = () =>
  useQuery({
    queryKey: wordStateKeys.liveCount(),
    queryFn: () => countLiveWords(getDb()),
  });

export const useSettings = () =>
  useQuery({ queryKey: settingsKeys.current(), queryFn: () => readSettings(getDb()) });

export const useInventory = () =>
  useQuery({ queryKey: inventoryKeys.current(), queryFn: () => readInventory(getDb()) });

export const useJournalForDay = (day: string) =>
  useQuery({
    queryKey: journalKeys.byDay(day),
    queryFn: () => listJournalByDay(getDb(), day),
  });

export const useJournalForWeek = (day: string) =>
  useQuery({
    queryKey: journalKeys.between(day, day),
    queryFn: () => listJournalBetween(getDb(), day, day),
  });

/** Слова, которые сад ещё не знает: их состояние создаётся при первом показе. */
export const useEnsureWordStates = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (wordIds: readonly string[], nowMs: number) => {
      const db = getDb();
      const existing = await readAllWordStates(db);
      const known = new Set(existing.map((state) => state.wordId));
      const fresh = wordIds.filter((id) => !known.has(id)).map((id) => createWordState(id, nowMs));
      if (fresh.length > 0) {
        await db.wordsState.bulkPut(fresh);
        await queryClient.invalidateQueries({ queryKey: wordStateKeys.all });
      }
      return fresh.length;
    },
    [queryClient],
  );
};

/** План дня: 4 поручения, ≤4 новых слова, «день закрыт» при нуле искр. */
export const useDayPlan = (day: string, nowMs: number) =>
  useQuery({
    queryKey: dayKeys.plan(day, currentRegionId()),
    queryFn: async (): Promise<DayPlan> => {
      const db = getDb();
      const regionId = currentRegionId();
      const [states, record, openSessions] = await Promise.all([
        readAllWordStates(db),
        readDay(db, day),
        Promise.all(regionQuests(regionId).map((quest) => readOpenSession(db, quest.id))),
      ]);
      const doneQuestIds = openSessions
        .map((session, index) => (session === null ? null : regionQuests(regionId)[index]?.id))
        .filter((id): id is string => id !== null);
      return buildDayPlan({
        day,
        regionId,
        words: catalog.words,
        quests: catalog.quests,
        wordStates: states,
        nowMs,
        sparksLeft: record?.sparksLeft ?? DAILY_SPARKS_CAP,
        doneQuestIds,
      });
    },
  });

/** Тратить искры: одно поручение — 10 искр, больше нельзя. */
export const useSpendSparks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: dayKeys.all,
    mutationFn: async (day: string) => {
      const before = await readDay(getDb(), day);
      const after = await spendSparks(getDb(), day);
      return { day, before, after };
    },
    onSuccess: async (_result, day) => {
      await queryClient.invalidateQueries({ queryKey: dayKeys.day(day) });
      await queryClient.invalidateQueries({ queryKey: dayKeys.all });
    },
  });
};

/** Повторение слова в саду: состояние пересчитывает FSRS-lite и пишется в базу. */
export const useReviewWord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { wordId: string; grade: SrsGrade; nowMs: number }) => {
      const db = getDb();
      const state = await readAllWordStates(db).then((states) =>
        states.find((item) => item.wordId === input.wordId),
      );
      if (!state) {
        const created = createWordState(input.wordId, input.nowMs);
        await writeWordState(db, reviewWord(created, input.grade, input.nowMs));
        return reviewWord(created, input.grade, input.nowMs);
      }
      return reviewStoredWord(db, input.wordId, input.grade, input.nowMs);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: wordStateKeys.all });
    },
  });
};

/** Знакомство с новым словом: попадает в сад как росток. */
export const usePlantWord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { wordId: string; nowMs: number }) => {
      const state = createWordState(input.wordId, input.nowMs);
      await writeWordState(getDb(), state);
      return state;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: wordStateKeys.all });
    },
  });
};

export const useStartSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: SessionRecord) =>
      startSession(getDb(), sessionRecordSchema.parse(record)),
    onSuccess: async (session) => {
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      await queryClient.invalidateQueries({ queryKey: sessionKeys.open(session.questId) });
    },
  });
};

export const useSaveSessionProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; stepIndex: number; stepTotal: number }) =>
      saveSessionProgress(getDb(), input.id, {
        stepIndex: input.stepIndex,
        stepTotal: input.stepTotal,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
};

export const useFinishSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; finishedAt: string }) =>
      finishSession(getDb(), input.id, input.finishedAt),
    onSuccess: async (session) => {
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      if (session) {
        await queryClient.invalidateQueries({ queryKey: sessionKeys.open(session.questId) });
      }
    },
  });
};

export const useOpenSession = (questId: string | undefined) =>
  useQuery({
    queryKey: sessionKeys.open(questId ?? "none"),
    queryFn: async () => (questId ? readOpenSession(getDb(), questId) : null),
    enabled: Boolean(questId),
  });

/** Запись события в журнал: только локально, для отчёта родителю (NFR-1). */
export const useLogEvent = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (input: {
      day: string;
      at: string;
      type: Parameters<typeof appendJournal>[1]["type"];
      subject: string;
      amount?: number;
    }) => {
      await appendJournal(getDb(), input);
      await queryClient.invalidateQueries({ queryKey: journalKeys.all });
    },
    [queryClient],
  );
};

export const usePatchDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { day: string; patch: (record: DayRecord) => DayRecord }) =>
      updateDay(getDb(), input.day, input.patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dayKeys.all });
    },
  });
};

export const useAddInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      crystals?: number;
      wordCardIds?: string[];
      companionIds?: string[];
      reactionIds?: string[];
    }) => {
      const current: Inventory = await readInventory(getDb());
      const merge = <T>(a: readonly T[], b: readonly T[] = []): T[] => [...new Set([...a, ...b])];
      return writeInventory(getDb(), {
        ...current,
        crystals: current.crystals + (input.crystals ?? 0),
        wordCardIds: merge(current.wordCardIds, input.wordCardIds),
        companionIds: merge(current.companionIds, input.companionIds),
        reactionIds: merge(current.reactionIds, input.reactionIds),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
};

/** Стадия растения для экрана сада. */
export const stageOf = (state: WordState) => plantStage(state);

/** Ключ дня для заголовков и журнала. */
export const keyOfDay = (date: Date): string => dayKeyOf(date);
