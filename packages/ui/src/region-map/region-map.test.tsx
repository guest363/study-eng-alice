import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type MapNode, RegionMap } from "./region-map";

const nodes: MapNode[] = [
  { id: "mondstadt", label: "Мондштадт", order: 1, element: "anemo", opened: true, progress: 0.4 },
  { id: "liyue", label: "Ли Юэ", order: 2, element: "geo", opened: false, progress: 0 },
];

describe("RegionMap", () => {
  it("открытый регион — кнопка, закрытый — под Безмолвием и не нажимается", () => {
    render(<RegionMap nodes={nodes} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Мондштадт" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Ли Юэ: под Безмолвием" })).toBeDisabled();
  });

  it("выбор региона уходит в обработчик", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RegionMap nodes={nodes} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Мондштадт" }));
    expect(onSelect).toHaveBeenCalledWith("mondstadt");
  });
});
