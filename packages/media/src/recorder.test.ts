/**
 * Тесты самозаписи: без микрофона фича не появляется, с микрофоном — пишет и отдаёт
 * ссылку для прослушивания (task.md RF-4.9).
 */
import { describe, expect, it, vi } from "vitest";
import { createVoiceRecorder, type RecorderEngine } from "./recorder";

/** Поддельный MediaRecorder: пишет один чанк и останавливается по stop(). */
const createFakeRecorder = () => {
  const instances: FakeRecorder[] = [];
  const engine: RecorderEngine = {
    isTypeSupported: (type) => type.startsWith("audio/webm"),
    create: () => {
      const instance = new FakeRecorder();
      instances.push(instance);
      return instance as unknown as MediaRecorder;
    },
  };
  return { engine, instances };
};

class FakeRecorder {
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  start(): void {}
  stop(): void {
    this.ondataavailable?.({ data: new Blob(["голос"]) } as BlobEvent);
    this.onstop?.();
  }
}

const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;

const fakeDevices = (ok: boolean): MediaDevices =>
  ({
    getUserMedia: ok
      ? vi.fn().mockResolvedValue(fakeStream)
      : vi.fn().mockRejectedValue(new Error("нет")),
  }) as unknown as MediaDevices;

describe("самозапись голоса", () => {
  it("без MediaRecorder фича не поддерживается, но и не падает", () => {
    const recorder = createVoiceRecorder({ mediaDevices: fakeDevices(true), recorder: null });
    expect(recorder.isSupported()).toBe(false);
    expect(recorder.getState()).toBe("unsupported");
  });

  it("без микрофона состояние unsupported, запись не начинается", async () => {
    const { engine } = createFakeRecorder();
    const recorder = createVoiceRecorder({ mediaDevices: fakeDevices(false), recorder: engine });
    await recorder.start();
    expect(recorder.getState()).toBe("unsupported");
  });

  it("записывает и отдаёт ссылку на прослушивание", async () => {
    const { engine, instances } = createFakeRecorder();
    const createUrl = vi.fn(() => "blob:recording");
    const recorder = createVoiceRecorder({
      mediaDevices: fakeDevices(true),
      recorder: engine,
      createUrl,
    });
    await recorder.start();
    expect(recorder.getState()).toBe("recording");
    recorder.stop();
    expect(instances).toHaveLength(1);
    expect(recorder.getState()).toBe("recorded");
    expect(recorder.getUrl()).toBe("blob:recording");
  });

  it("микрофон освобождается после остановки", async () => {
    const { engine } = createFakeRecorder();
    const track = { stop: vi.fn() };
    const devices = {
      getUserMedia: vi
        .fn()
        .mockResolvedValue({ getTracks: () => [track] } as unknown as MediaStream),
    } as unknown as MediaDevices;
    const recorder = createVoiceRecorder({ mediaDevices: devices, recorder: engine });
    await recorder.start();
    recorder.stop();
    expect(track.stop).toHaveBeenCalled();
  });

  it("сброс возвращает к состоянию «ничего не записано»", async () => {
    const { engine } = createFakeRecorder();
    const recorder = createVoiceRecorder({ mediaDevices: fakeDevices(true), recorder: engine });
    await recorder.start();
    recorder.stop();
    recorder.reset();
    expect(recorder.getState()).toBe("idle");
    expect(recorder.getUrl()).toBeNull();
  });
});
