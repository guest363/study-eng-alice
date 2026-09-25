/**
 * @tw/media — звуковой слой: TTS через speechSynthesis (выбор голоса, темп, очередь),
 * короткие звуки, самозапись через MediaRecorder (гейт G4).
 *
 * Правила браузеров: автовоспроизведение только после первого тапа,
 * getVoices() асинхронен (см. agent.md, «Известные ловушки»).
 */
export {
  type AudioBus,
  type AudioBusOptions,
  type AudioSettings,
  createAudioBus,
} from "./audio-bus";
export {
  type AudioPlayer,
  createSfxPlayer,
  SFX_NAMES,
  type SfxFactory,
  type SfxName,
  type SfxOptions,
  type SfxPlayer,
} from "./sfx";
export {
  createTtsEngine,
  type SpeakOptions,
  type SpeechEngine,
  type TtsEngine,
  type TtsEngineOptions,
  type TtsStatus,
} from "./tts";
export {
  isUsableVoice,
  pickVoice,
  type SpeechVoiceInfo,
  UNFRIENDLY_VOICE_MARKERS,
  usableVoices,
} from "./voices";
