/**
 * Движок озвучки на Web Speech API (task.md RF-10.1, RF-10.2).
 *
 * Правила, без которых звук ломается на телефоне Алисы:
 * — говорить можно только после жеста пользователя, иначе браузер молчит (iOS);
 * — очередь не должна «заикаться» при быстрых тапах: новый тап отменяет предыдущую фразу;
 * — getVoices() асинхронен, список обновляется по событию voiceschanged.
 *
 * Модуль не знает про React: его дёргают из обработчиков и из подписки на шину @tw/core.
 * Синтезатор внедряется снаружи — так движок проверяется тестами без браузера.
 */
import { type Accent, NEW_WORD_RATE, SLOW_RATE } from "@tw/core";
import { pickVoice, type SpeechVoiceInfo, usableVoices } from "./voices";

export type SpeakOptions = Readonly<{
  accent?: Accent;
  rate?: number;
  slow?: boolean;
  /** false — не прерывать текущую фразу (длинные предложения ставятся в очередь). */
  interrupt?: boolean;
}>;

export type TtsStatus = Readonly<{
  supported: boolean;
  /** Браузер разрешил звук: было хотя бы одно пользовательское жесто. */
  unlocked: boolean;
  voices: readonly SpeechVoiceInfo[];
  accent: Accent;
}>;

/** Минимальный кусок Web Speech API, который нужен движку. */
export type SpeechEngine = Readonly<{
  speak: (utterance: SpeechSynthesisUtterance) => void;
  cancel: () => void;
  getVoices: () => SpeechSynthesisVoice[];
  addEventListener: (type: "voiceschanged", handler: () => void) => void;
}>;

export type TtsEngineOptions = Readonly<{
  synth?: SpeechEngine | null;
  onStatus?: (status: TtsStatus) => void;
}>;

const systemSynth = (): SpeechEngine | null =>
  typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

const toInfo = (voice: SpeechSynthesisVoice): SpeechVoiceInfo => ({
  voiceURI: voice.voiceURI,
  name: voice.name,
  lang: voice.lang,
  localService: voice.localService,
});

export const createTtsEngine = (options: TtsEngineOptions = {}) => {
  const synth = options.synth === undefined ? systemSynth() : options.synth;
  let accent: Accent = "us";
  let rate = NEW_WORD_RATE;
  let unlocked = false;
  let rawVoices: SpeechSynthesisVoice[] = [];
  const handlers = new Set<(status: TtsStatus) => void>();

  const status = (): TtsStatus => ({
    supported: synth !== null,
    unlocked,
    voices: rawVoices.map(toInfo),
    accent,
  });

  const notify = (): void => {
    const snapshot = status();
    options.onStatus?.(snapshot);
    for (const handler of handlers) {
      handler(snapshot);
    }
  };

  const refreshVoices = (): void => {
    if (!synth) {
      return;
    }
    const list = synth.getVoices();
    // Список приходит асинхронно: на старте он почти всегда пуст, ждём voiceschanged.
    if (list.length === 0) {
      return;
    }
    rawVoices = list;
    notify();
  };

  synth?.addEventListener("voiceschanged", refreshVoices);
  refreshVoices();

  const setAccent = (next: Accent): void => {
    accent = next;
    notify();
  };

  const setRate = (next: number): void => {
    rate = next;
  };

  /** Вызвать из обработчика первого тапа: после жеста браузер разрешает звук. */
  const unlock = (): void => {
    if (unlocked) {
      return;
    }
    unlocked = true;
    refreshVoices();
    notify();
  };

  const speak = (text: string, speakOptions: SpeakOptions = {}): boolean => {
    if (!synth || !unlocked || text.trim().length === 0) {
      return false;
    }
    if (speakOptions.interrupt !== false) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const wanted = pickVoice(rawVoices.map(toInfo), speakOptions.accent ?? accent);
    const voice = wanted ? rawVoices.find((item) => item.voiceURI === wanted.voiceURI) : undefined;
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = accent === "uk" ? "en-GB" : "en-US";
    }
    utterance.rate = speakOptions.slow ? SLOW_RATE : (speakOptions.rate ?? rate);
    synth.speak(utterance);
    return true;
  };

  /** Кнопка «медленно» в упражнениях на произношение (RF-4.4). */
  const speakSlow = (text: string, speakOptions: SpeakOptions = {}): boolean =>
    speak(text, { ...speakOptions, slow: true });

  const stop = (): void => {
    synth?.cancel();
  };

  /** Голоса, которые родитель может выбрать в настройках (RF-11.3). */
  const availableVoices = (): SpeechVoiceInfo[] => usableVoices(rawVoices.map(toInfo));

  const onStatus = (handler: (value: TtsStatus) => void): (() => void) => {
    handlers.add(handler);
    handler(status());
    return () => {
      handlers.delete(handler);
    };
  };

  return { speak, speakSlow, stop, unlock, setAccent, setRate, availableVoices, onStatus, status };
};

export type TtsEngine = ReturnType<typeof createTtsEngine>;
