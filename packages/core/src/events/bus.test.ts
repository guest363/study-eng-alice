/**
 * Тесты шины событий: подписка с автоотпиской нужна, чтобы экраны не «протекали»
 * после перехода между маршрутами.
 */
import { describe, expect, it } from "vitest";
import { appBus, onAppEvent } from "./bus";

describe("шина событий", () => {
  it("доставляет событие подписчику", () => {
    const heard: string[] = [];
    const off = onAppEvent("audio:speak", ({ text }) => heard.push(text));
    appBus.emit("audio:speak", { text: "book", voice: "us", rate: 0.85, slow: false });
    off();
    expect(heard).toEqual(["book"]);
  });

  it("после отписки события больше не приходят", () => {
    const heard: string[] = [];
    const off = onAppEvent("audio:sfx", ({ name }) => heard.push(name));
    off();
    appBus.emit("audio:sfx", { name: "chest" });
    expect(heard).toEqual([]);
  });

  it("события разных типов не путаются", () => {
    const speaks: string[] = [];
    const chests: string[] = [];
    const offSpeak = onAppEvent("audio:speak", ({ text }) => speaks.push(text));
    const offSfx = onAppEvent("audio:sfx", ({ name }) => chests.push(name));
    appBus.emit("audio:speak", { text: "hello", voice: "uk", rate: 1, slow: true });
    offSpeak();
    offSfx();
    expect(speaks).toEqual(["hello"]);
    expect(chests).toEqual([]);
  });
});
