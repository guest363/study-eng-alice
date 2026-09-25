/**
 * Шина событий домена (task.md §8.3): движок не знает о звуке, анимациях и журнале —
 * он публикует события, а @tw/media, @tw/ui и @tw/db на них подписываются.
 *
 * События намеренно «плоские»: только то, что уже решено, без сырых DOM-событий.
 */
import mitt from "mitt";
import type { Chest, SrsGrade } from "../contracts";

export type ExerciseDoneEvent = {
  questId: string;
  /** id упражнения в пределах квеста: "<questId>#<step>#<item>". */
  exerciseId: string;
  type: string;
  grade: SrsGrade;
  hintsUsed: number;
  wordIds: readonly string[];
  xp: number;
};

export type ReactionTriggeredEvent = {
  reactionId: string;
  nameRu: string;
  bonus: string;
  wordIds: readonly string[];
};

export type AppEvents = {
  "exercise:done": ExerciseDoneEvent;
  "reaction:triggered": ReactionTriggeredEvent;
  "session:ended": { questId: string; day: string; xpGained: number; chest: Chest | null };
  "audio:speak": { text: string; voice: "us" | "uk"; rate: number; slow: boolean };
  "audio:sfx": { name: "chest" | "reaction" | "water" | "bloom" };
};

export const appBus = mitt<AppEvents>();

/** Подписка с автоматической отпиской — чтобы не забывать off() в эффектах. */
export const onAppEvent = <K extends keyof AppEvents>(
  type: K,
  handler: (payload: AppEvents[K]) => void,
): (() => void) => {
  appBus.on(type, handler);
  return () => appBus.off(type, handler);
};
