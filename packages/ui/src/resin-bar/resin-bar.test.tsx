import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResinBar } from "./resin-bar";

describe("ResinBar", () => {
  it("показывает запас искр и сколько поручений на него хватает", () => {
    render(<ResinBar sparksLeft={30} />);
    expect(screen.getByText("30 / 40")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("3"),
    );
  });

  it("не показывает больше дневного запаса", () => {
    render(<ResinBar sparksLeft={999} />);
    expect(screen.getByText("40 / 40")).toBeInTheDocument();
  });

  it("пустой запас всё равно рисуется, а не исчезает", () => {
    render(<ResinBar sparksLeft={0} />);
    expect(screen.getByText("0 / 40")).toBeInTheDocument();
  });
});
