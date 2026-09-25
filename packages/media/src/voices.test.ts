/**
 * Тесты голоса: выбор en-US/en-GB и отбраковка «странных» системных голосов
 * (микро-ресерч R2, docs/R2-tts-voices.md).
 */
import { describe, expect, it } from "vitest";
import { isUsableVoice, pickVoice, type SpeechVoiceInfo, usableVoices } from "./voices";

const voice = (name: string, lang: string): SpeechVoiceInfo => ({
  voiceURI: `${name}-${lang}`,
  name,
  lang,
  localService: true,
});

const voices: SpeechVoiceInfo[] = [
  voice("Samantha", "en-US"),
  voice("Alex", "en-US"),
  voice("Daniel", "en-GB"),
  voice("Karen", "en-AU"),
  voice("Zarvox", "en-US"),
  voice("Albert", "en-US"),
  voice("Milena", "ru-RU"),
];

describe("выбор голоса", () => {
  it("для en-US берёт американский голос", () => {
    expect(pickVoice(voices, "us")?.name).toBe("Samantha");
  });

  it("для en-GB берёт британский голос", () => {
    expect(pickVoice(voices, "uk")?.name).toBe("Daniel");
  });

  it("если точного акцента нет — берёт любой английский", () => {
    expect(pickVoice([voice("Samantha", "en-AU")], "uk")?.name).toBe("Samantha");
  });

  it("английских голосов нет — возвращаем null, а не первый попавшийся", () => {
    expect(pickVoice([voice("Milena", "ru-RU")], "us")).toBeNull();
  });

  it("пустой список голосов не считается ошибкой", () => {
    expect(pickVoice([], "us")).toBeNull();
  });

  it("подчёркивания в lang нормализуются", () => {
    expect(pickVoice([voice("Samantha", "en_US")], "us")?.name).toBe("Samantha");
  });
});

describe("недружественные голоса", () => {
  it("голоса-шутки отбраковываются", () => {
    for (const name of ["Zarvox", "Albert", "Bad News", "Bells", "Organ", "Whisper"]) {
      expect(isUsableVoice(voice(name, "en-US"))).toBe(false);
    }
  });

  it("не-английские голоса отбраковываются", () => {
    expect(isUsableVoice(voice("Milena", "ru-RU"))).toBe(false);
  });

  it("в настройках показываются только дружественные английские голоса", () => {
    expect(usableVoices(voices).map((item) => item.name)).toEqual([
      "Samantha",
      "Alex",
      "Daniel",
      "Karen",
    ]);
  });
});
