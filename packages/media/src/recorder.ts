/**
 * Самозапись голоса через MediaRecorder (task.md RF-4.9).
 *
 * Правила детского UX: оценки схожести нет — ребёнок слушает себя и наставника.
 * Если микрофона нет или браузер не умеет писать звук, фича молча не появляется:
 * createVoiceRecorder вернёт unsupported, а кнопка «Я сказал!» остаётся.
 */
export type RecorderState = "idle" | "recording" | "recorded" | "unsupported";

export type RecorderSnapshot = Readonly<{ state: RecorderState; url: string | null }>;

export type VoiceRecorder = Readonly<{
  /** Текущее состояние. */
  getState: () => RecorderState;
  /** Ссылка на записанный кусок для прослушивания; null, если записи нет. */
  getUrl: () => string | null;
  isSupported: () => boolean;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}>;

/** Минимальный кусок MediaRecorder, который нужен движку — внедряется снаружи. */
export type RecorderEngine = Readonly<{
  isTypeSupported: (mimeType: string) => boolean;
  create: (stream: MediaStream) => MediaRecorder;
}>;

export type RecorderOptions = Readonly<{
  mediaDevices?: MediaDevices | null;
  recorder?: RecorderEngine | null;
  preferredTypes?: readonly string[];
  createUrl?: (blob: Blob) => string;
}>;

const DEFAULT_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"] as const;

const systemRecorder = (): RecorderEngine | null => {
  if (typeof window === "undefined" || typeof window.MediaRecorder !== "function") {
    return null;
  }
  return {
    isTypeSupported: (mimeType: string) => MediaRecorder.isTypeSupported(mimeType),
    create: (stream) => new MediaRecorder(stream),
  };
};

export const createVoiceRecorder = (options: RecorderOptions = {}): VoiceRecorder => {
  const mediaDevices =
    options.mediaDevices === undefined
      ? (globalThis.navigator?.mediaDevices ?? null)
      : options.mediaDevices;
  const engine = options.recorder === undefined ? systemRecorder() : options.recorder;
  const types = options.preferredTypes ?? DEFAULT_TYPES;
  const createUrl = options.createUrl ?? ((blob: Blob) => URL.createObjectURL(blob));

  let state: RecorderState = mediaDevices && engine ? "idle" : "unsupported";
  let url: string | null = null;
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];

  const releaseStream = (): void => {
    for (const track of stream?.getTracks() ?? []) {
      track.stop();
    }
    stream = null;
  };

  return {
    getState: () => state,
    getUrl: () => url,
    isSupported: () => state !== "unsupported",
    start: async () => {
      if (state === "recording" || !mediaDevices || !engine) {
        return;
      }
      try {
        stream = await mediaDevices.getUserMedia({ audio: true });
      } catch {
        // Микрофон запрещён или отсутствует: фича исчезает, упражнение остаётся.
        state = "unsupported";
        return;
      }
      const mimeType = types.find((type) => engine.isTypeSupported(type)) ?? "";
      recorder = engine.create(stream);
      chunks = [];
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        url = createUrl(blob);
        state = "recorded";
        releaseStream();
      };
      recorder.start();
      state = "recording";
    },
    stop: () => {
      if (recorder && state === "recording") {
        recorder.stop();
      }
    },
    reset: () => {
      url = null;
      chunks = [];
      state = mediaDevices && engine ? "idle" : "unsupported";
    },
  };
};
