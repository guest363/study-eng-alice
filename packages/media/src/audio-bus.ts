/**
 * Звуковая шина пакета: мост между событиями домена (@tw/core) и браузерным звуком
 * (task.md §8.3). Компоненты не трогают speechSynthesis — они публикуют audio:speak
 * в общую шину, а этот модуль говорит.
 *
 * Звук включается только после первого жеста (политика браузеров) и полностью
 * выключается в настройках родителя (RF-10.2, RF-11.3).
 */
import { type Accent, type AppEvents, appBus, NEW_WORD_RATE } from "@tw/core";
import type { SfxPlayer } from "./sfx";
import type { TtsEngine } from "./tts";

export type AudioSettings = Readonly<{
  accent: Accent;
  rate: number;
  sfxOn: boolean;
}>;

export type AudioBusOptions = Readonly<{
  engine: TtsEngine;
  sfx: SfxPlayer;
  settings?: Partial<AudioSettings>;
}>;

export type AudioBus = Readonly<{
  /** Подписаться на шину. Возвращает отписку — её зовут в useEffect. */
  connect: () => () => void;
  /** Настройки родителя применяются сразу, без перезапуска (RF-11.3). */
  setSettings: (settings: AudioSettings) => void;
  /** Вызывается из первого обработчика жеста. */
  unlock: () => void;
  settings: () => AudioSettings;
}>;

const DEFAULT_SETTINGS: AudioSettings = { accent: "us", rate: NEW_WORD_RATE, sfxOn: true };

export const createAudioBus = (options: AudioBusOptions): AudioBus => {
  const { engine, sfx } = options;
  let settings: AudioSettings = { ...DEFAULT_SETTINGS, ...options.settings };

  const apply = (): void => {
    engine.setAccent(settings.accent);
    engine.setRate(settings.rate);
    sfx.setEnabled(settings.sfxOn);
  };
  apply();

  const onSpeak = (payload: AppEvents["audio:speak"]): void => {
    engine.speak(payload.text, {
      accent: payload.voice,
      rate: payload.rate,
      slow: payload.slow,
    });
  };

  const onSfx = (payload: AppEvents["audio:sfx"]): void => {
    sfx.play(payload.name);
  };

  return {
    connect: () => {
      appBus.on("audio:speak", onSpeak);
      appBus.on("audio:sfx", onSfx);
      return () => {
        appBus.off("audio:speak", onSpeak);
        appBus.off("audio:sfx", onSfx);
      };
    },
    setSettings: (next: AudioSettings) => {
      settings = next;
      apply();
    },
    unlock: () => engine.unlock(),
    settings: () => settings,
  };
};
