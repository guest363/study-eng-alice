import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChestOverlay } from "./chest-overlay";

const items = [
  { id: "card-book", label: "Карта слова: book" },
  { id: "scroll-1", label: "Свиток Ноэлль ×2" },
];

describe("ChestOverlay", () => {
  it("содержимое видно ДО открытия — награда объявлена заранее", () => {
    render(
      <ChestOverlay
        chest="common"
        title="Обычный сундук"
        items={items}
        onOpen={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Карта слова: book")).toBeInTheDocument();
    expect(screen.getByText("Открыть")).toBeInTheDocument();
  });

  it("после открытия появляется кнопка «Забрать»", async () => {
    const user = userEvent.setup();
    render(
      <ChestOverlay
        chest="rich"
        title="Богатый сундук"
        items={items}
        crystals={2}
        onOpen={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Открыть" }));
    expect(
      await screen.findByRole("button", { name: "Забрать" }, { timeout: 2500 }),
    ).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});
