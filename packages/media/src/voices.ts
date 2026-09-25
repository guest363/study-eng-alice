/**
 * Выбор английского голоса (task.md RF-10.1, микро-ресерч R2).
 *
 * Ловушка браузеров: speechSynthesis.getVoices() пуст до события voiceschanged, а на
 * iOS список появляется только после первого пользовательского жеста. Поэтому выбор
 * голоса живёт здесь, в @tw/media, а не в компонентах (agent.md, «Известные ловушки»).
 *
 * Приоритет голосов: сначала точное совпадение языка и акцента, потом любой en-*, иначе
 * системный дефолт. Детский режим: имена с «Novelty», «Bells», «Bad News», «Zarvox» и
 * прочие «странные» голоса отбрасываются — их произношение пугает ребёнка (docs/R2-tts-voices.md).
 */
import type { Accent } from "@tw/core";

/** Голос SpeechSynthesis в той форме, которую отдаёт браузер. */
export type SpeechVoiceInfo = Readonly<{
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
}>;

/** Подстроки в именах, из-за которых голос не берём (Robo voices и прочие «шутки»). */
export const UNFRIENDLY_VOICE_MARKERS = [
  "novelty",
  "albert",
  "bad news",
  "bells",
  "bubbles",
  "cellos",
  "organ",
  "zarvox",
  "trinoids",
  "boing",
  "jester",
  "superstar",
  "whisper",
  "wobble",
  "hysterical",
  "pipe organ",
] as const;

const LANG_BY_ACCENT: Record<Accent, string[]> = {
  us: ["en-us", "en_us", "en"],
  uk: ["en-gb", "en_gb", "en"],
};

const normalize = (value: string): string => value.trim().toLowerCase();

/** Голос английский и не входит в список недружественных. Акцент проверяется отдельно. */
export const isUsableVoice = (voice: SpeechVoiceInfo): boolean => {
  const lang = normalize(voice.lang);
  if (!lang.startsWith("en")) {
    return false;
  }
  const name = normalize(voice.name);
  return !UNFRIENDLY_VOICE_MARKERS.some((marker) => name.includes(marker));
};

/**
 * Лучший голос для акцента: сначала точное совпадение en-US/en-GB, затем любой
 * английский. null — если английских голосов на устройстве нет совсем.
 */
export const pickVoice = (
  voices: readonly SpeechVoiceInfo[],
  accent: Accent,
): SpeechVoiceInfo | null => {
  const usable = voices.filter((voice) => isUsableVoice(voice));
  for (const wanted of LANG_BY_ACCENT[accent]) {
    const exact = usable.find((voice) => normalize(voice.lang).replaceAll("_", "-") === wanted);
    if (exact) {
      return exact;
    }
  }
  return usable[0] ?? null;
};

/** Дружественные английские голоса — для настроек родителя (RF-11.3). */
export const usableVoices = (voices: readonly SpeechVoiceInfo[]): SpeechVoiceInfo[] =>
  voices.filter((voice) => isUsableVoice(voice));
