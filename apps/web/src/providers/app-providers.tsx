/**
 * Провайдеры приложения: TanStack Query и звук. Здесь же — правило браузеров:
 * звук включается только после первого жеста пользователя.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAudioBus, createSfxPlayer, createTtsEngine, type TtsStatus } from "@tw/media";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { catalog } from "../lib/catalog";

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Данные лежат локально, «сеть» есть только в первый визит: кэш живёт долго.
        staleTime: 60_000,
        gcTime: 30 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

const createEngine = () => {
  const tts = createTtsEngine();
  const sfx = createSfxPlayer({
    // Короткие звуки придут в G6 (микро-ресерч R5); пока манифест пуст — тишина без ошибок.
    resolve: (name) => catalog.media[`sfx-${name}`]?.file ?? null,
  });
  const bus = createAudioBus({ engine: tts, sfx });
  return { tts, sfx, bus };
};

type AudioContextValue = {
  speak: (text: string, options?: { accent?: "us" | "uk"; rate?: number; slow?: boolean }) => void;
  status: TtsStatus;
  supported: boolean;
};

const AudioContext = createContext<AudioContextValue | null>(null);

const useAudioContext = (): AudioContextValue => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("Звук доступен только внутри <AppProviders>");
  }
  return context;
};

export const useAudio = (): AudioContextValue => useAudioContext();

export const AppProviders = ({ children }: { readonly children: ReactNode }) => {
  const [client] = useState(createQueryClient);
  const engine = useMemo(createEngine, []);
  const [status, setStatus] = useState<TtsStatus>(() => engine.tts.status());
  const unlockedRef = useRef(false);

  useEffect(() => {
    const offBus = engine.bus.connect();
    const offStatus = engine.tts.onStatus(setStatus);
    return () => {
      offBus();
      offStatus();
    };
  }, [engine]);

  const unlock = useCallback(() => {
    if (unlockedRef.current) {
      return;
    }
    unlockedRef.current = true;
    engine.bus.unlock();
  }, [engine]);

  // Первый жест снимает запрет браузера на автовоспроизведение (agent.md, ловушки).
  useEffect(() => {
    const events: (keyof DocumentEventMap)[] = ["pointerdown", "keydown", "touchstart"];
    for (const event of events) {
      window.addEventListener(event, unlock, { once: true, passive: true });
    }
    return () => {
      for (const event of events) {
        window.removeEventListener(event, unlock);
      }
    };
  }, [unlock]);

  const value = useMemo<AudioContextValue>(
    () => ({
      speak: (text, options) => {
        unlock();
        engine.tts.speak(text, options);
      },
      status,
      supported: status.supported,
    }),
    [engine, status, unlock],
  );

  return (
    <QueryClientProvider client={client}>
      <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
    </QueryClientProvider>
  );
};
