/**
 * Тесты движка озвучки на поддельном синтезаторе: до жеста не говорим, быстрые тапы
 * не заикаются, темп и голос берутся из настроек (task.md RF-10.1, G2).
 */

import { appBus } from "@tw/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAudioBus } from "./audio-bus";
import { createSfxPlayer } from "./sfx";
import { createTtsEngine, type SpeechEngine } from "./tts";

/** Поддельный синтезатор: запоминает сказанное, умеет отменяться. */
const createFakeSynth = (initialVoices: SpeechSynthesisVoice[] = []) => {
  let voices = initialVoices;
  const spoken: SpeechSynthesisUtterance[] = [];
  const cancels: number[] = [];
  const listeners = new Map<string, () => void>();
  const synth: SpeechEngine = {
    speak: (utterance) => spoken.push(utterance),
    cancel: () => cancels.push(spoken.length),
    getVoices: () => voices,
    addEventListener: (type, handler) => listeners.set(type, handler),
  };
  return {
    synth,
    spoken,
    cancels,
    /** Имитация поздней подгрузки списка голосов. */
    loadVoices: (next: SpeechSynthesisVoice[]) => {
      voices = next;
      listeners.get("voiceschanged")?.();
    },
  };
};

const samantha = {
  voiceURI: "Samantha",
  name: "Samantha",
  lang: "en-US",
  localService: true,
  default: true,
};
const daniel = {
  voiceURI: "Daniel",
  name: "Daniel",
  lang: "en-GB",
  localService: true,
  default: false,
};
const zarvox = {
  voiceURI: "Zarvox",
  name: "Zarvox",
  lang: "en-US",
  localService: true,
  default: false,
};

/** SpeechSynthesisUtterance в node-окружении нужно подменить. */
class FakeUtterance {
  text: string;
  lang = "";
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

const withUtterance = <T>(body: () => T): T => {
  const original = globalThis.SpeechSynthesisUtterance;
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
    value: FakeUtterance,
    configurable: true,
    writable: true,
  });
  try {
    return body();
  } finally {
    Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
      value: original,
      configurable: true,
      writable: true,
    });
  }
};

const lastOf = (spoken: SpeechSynthesisUtterance[]) =>
  spoken[spoken.length - 1] as unknown as FakeUtterance;

afterEach(() => {
  appBus.all.clear();
});

describe("движок озвучки", () => {
  it("до первого жеста не говорим: браузер всё равно молчит", () => {
    const fake = createFakeSynth([samantha, daniel, zarvox]);
    const engine = createTtsEngine({ synth: fake.synth });
    withUtterance(() => {
      expect(engine.speak("book")).toBe(false);
      expect(fake.spoken).toHaveLength(0);
    });
  });

  it("после жеста говорит выбранным голосом", () => {
    const fake = createFakeSynth([samantha, daniel, zarvox]);
    const engine = createTtsEngine({ synth: fake.synth });
    engine.unlock();
    withUtterance(() => {
      expect(engine.speak("book")).toBe(true);
      expect(lastOf(fake.spoken).text).toBe("book");
      expect(lastOf(fake.spoken).voice?.name).toBe("Samantha");
      expect(lastOf(fake.spoken).rate).toBeCloseTo(0.85);
    });
  });

  it("список голосов, пришедший позже, подхватывается", () => {
    const fake = createFakeSynth([]);
    const engine = createTtsEngine({ synth: fake.synth });
    expect(engine.status().voices).toHaveLength(0);
    fake.loadVoices([samantha]);
    expect(engine.status().voices).toHaveLength(1);
  });

  it("быстрые тапы не заикаются: предыдущая фраза отменяется", () => {
    const fake = createFakeSynth([samantha]);
    const engine = createTtsEngine({ synth: fake.synth });
    engine.unlock();
    withUtterance(() => {
      engine.speak("book");
      engine.speak("apple");
      expect(fake.cancels).toHaveLength(2);
      expect(fake.spoken).toHaveLength(2);
    });
  });

  it("очередь не обрывается, когда interrupt выключен", () => {
    const fake = createFakeSynth([samantha]);
    const engine = createTtsEngine({ synth: fake.synth });
    engine.unlock();
    withUtterance(() => {
      engine.speak("I can jump", { interrupt: false });
      expect(fake.cancels).toHaveLength(0);
    });
  });

  it("медленное повторение звучит в темпе 0.7", () => {
    const fake = createFakeSynth([samantha]);
    const engine = createTtsEngine({ synth: fake.synth });
    engine.unlock();
    withUtterance(() => {
      engine.speakSlow("three");
      expect(lastOf(fake.spoken).rate).toBeCloseTo(0.7);
    });
  });

  it("смена акцента сразу меняет голос и язык", () => {
    const fake = createFakeSynth([samantha, daniel]);
    const engine = createTtsEngine({ synth: fake.synth });
    engine.unlock();
    engine.setAccent("uk");
    withUtterance(() => {
      engine.speak("wind");
      expect(lastOf(fake.spoken).voice?.name).toBe("Daniel");
      expect(lastOf(fake.spoken).lang).toBe("en-GB");
    });
  });

  it("пустой текст не произносится", () => {
    const fake = createFakeSynth([samantha]);
    const engine = createTtsEngine({ synth: fake.synth });
    engine.unlock();
    withUtterance(() => {
      expect(engine.speak("   ")).toBe(false);
      expect(fake.spoken).toHaveLength(0);
    });
  });

  it("без поддержки speechSynthesis движок не падает", () => {
    const engine = createTtsEngine({ synth: null });
    engine.unlock();
    expect(engine.status().supported).toBe(false);
    expect(engine.speak("book")).toBe(false);
  });

  it("подписчик статуса снимается и больше не получает события", () => {
    const fake = createFakeSynth([samantha]);
    const engine = createTtsEngine({ synth: fake.synth });
    const seen: number[] = [];
    const off = engine.onStatus((status) => seen.push(status.voices.length));
    engine.setAccent("uk");
    off();
    engine.setAccent("us");
    // Первое событие — текущее состояние при подписке, второе — смена акцента.
    expect(seen).toEqual([1, 1]);
  });
});

describe("звуковая шина", () => {
  const createBus = (files: Record<string, string> = {}) => {
    const fake = createFakeSynth([samantha, daniel]);
    const engine = createTtsEngine({ synth: fake.synth });
    const played: string[] = [];
    const sfx = createSfxPlayer({
      resolve: (name) => files[name] ?? null,
      factory: (src) => ({
        play: () => played.push(src),
        currentTime: 0,
      }),
    });
    return { bus: createAudioBus({ engine, sfx }), engine, sfx, fake, played };
  };

  it("озвучивает событие audio:speak из шины домена", () => {
    const { bus, engine, fake } = createBus();
    bus.connect();
    engine.unlock();
    withUtterance(() => {
      appBus.emit("audio:speak", { text: "cat", voice: "us", rate: 0.9, slow: false });
      expect(lastOf(fake.spoken).text).toBe("cat");
    });
  });

  it("играет короткий звук из манифеста", () => {
    const { bus, played } = createBus({ chest: "media/sfx/chest.mp3" });
    bus.connect();
    appBus.emit("audio:sfx", { name: "chest" });
    expect(played).toEqual(["media/sfx/chest.mp3"]);
  });

  it("отсутствующий звук не ломает и не шумит", () => {
    const { bus, played } = createBus();
    bus.connect();
    expect(() => appBus.emit("audio:sfx", { name: "water" })).not.toThrow();
    expect(played).toEqual([]);
  });

  it("настройки родителя выключают короткие звуки", () => {
    const { bus, sfx, played } = createBus({ chest: "media/sfx/chest.mp3" });
    bus.connect();
    bus.setSettings({ accent: "uk", rate: 0.8, sfxOn: false });
    appBus.emit("audio:sfx", { name: "chest" });
    expect(played).toEqual([]);
    expect(sfx.isEnabled()).toBe(false);
  });

  it("отписка действительно отключает шину", () => {
    const { bus, engine, fake } = createBus();
    const disconnect = bus.connect();
    disconnect();
    engine.unlock();
    withUtterance(() => {
      appBus.emit("audio:speak", { text: "cat", voice: "us", rate: 1, slow: false });
      expect(fake.spoken).toHaveLength(0);
    });
  });
});

describe("короткие звуки", () => {
  it("звук играет с начала и не бросает исключений при отсутствии файла", () => {
    const times: number[] = [];
    const player = createSfxPlayer({
      resolve: (name) => (name === "bloom" ? "media/sfx/bloom.mp3" : null),
      factory: () => ({
        play: vi.fn(),
        get currentTime() {
          return 0;
        },
        set currentTime(value: number) {
          times.push(value);
        },
      }),
    });
    expect(player.play("bloom")).toBe(true);
    expect(times).toEqual([0]);
    expect(player.play("reaction")).toBe(false);
    expect(player.lastPlayed()?.name).toBe("bloom");
  });
});
