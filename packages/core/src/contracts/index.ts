/** Контракты данных: единственные Zod-схемы курса. Контент валидируется ими на сборке и в рантайме. */
export {
  type AudioSource,
  audioSourceSchema,
  type Bilingual,
  bilingualSchema,
  mediaKeySchema,
} from "./common";
export { type Companion, companionSchema } from "./companion";
export { type ElementIdValue, elementIdSchema } from "./element";
export { type Exercise, exerciseSchema } from "./exercise";
export {
  type MediaEntry,
  type MediaManifest,
  mediaEntrySchema,
  mediaManifestSchema,
} from "./media";
export { type PaimonBank, paimonBankSchema } from "./paimon";
export {
  type DayRecord,
  dayRecordSchema,
  type Inventory,
  inventorySchema,
  type JournalEntry,
  type JournalType,
  journalEntrySchema,
  journalTypeSchema,
  type SessionRecord,
  type SessionStatus,
  type SrsGrade,
  sessionRecordSchema,
  sessionStatusSchema,
  srsGradeSchema,
  type WordState,
  wordStateSchema,
} from "./progress";
export { type Chest, chestSchema, type Quest, type QuestStep, questSchema } from "./quest";
export {
  type Reaction,
  type ReactionBonus,
  reactionBonusSchema,
  reactionListSchema,
  reactionSchema,
} from "./reaction";
export { type Region, regionSchema } from "./region";
export { type Settings, settingsSchema } from "./settings";
export { type Labels, labelsSchema, srsGradeLabelKeys } from "./ui";
export {
  type PartOfSpeech,
  partOfSpeechSchema,
  type Word,
  wordListSchema,
  wordSchema,
} from "./word";
