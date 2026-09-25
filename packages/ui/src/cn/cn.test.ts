import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("склеивает классы через пробел", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("пропускает пустые и ложные значения", () => {
    expect(cn("a", false, undefined, null, "", "b")).toBe("a b");
  });

  it("возвращает пустую строку без аргументов", () => {
    expect(cn()).toBe("");
  });
});
