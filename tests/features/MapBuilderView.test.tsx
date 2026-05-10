import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GardenState } from "../../src/domain/models";
import { MapBuilderView } from "../../src/features/mapBuilder/MapBuilderView";

const gardenState: GardenState = {
  version: 1,
  map: { id: "map-1", name: "Testkarta" },
  beds: [],
  zones: [],
  plants: [],
  tasks: [],
  historyEvents: [],
  photos: [],
};

describe("MapBuilderView", () => {
  it("adds a house and applies the generated SVG as map background", async () => {
    const user = userEvent.setup();
    const onApplyGardenState = vi.fn();

    render(<MapBuilderView gardenState={gardenState} onApplyGardenState={onApplyGardenState} />);

    await user.click(screen.getByRole("button", { name: "Lägg till hus" }));
    expect(screen.getByRole("button", { name: "Hus" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Använd som kartbild" }));

    expect(onApplyGardenState).toHaveBeenCalledWith(
      expect.objectContaining({
        map: expect.objectContaining({
          backgroundImage: expect.stringMatching(/^data:image\/svg\+xml,/),
        }),
      }),
    );
  });

  it("edits the plot shape with handles instead of coordinate fields", async () => {
    const user = userEvent.setup();

    const { container } = render(<MapBuilderView gardenState={gardenState} onApplyGardenState={vi.fn()} />);

    expect(screen.queryByLabelText("X")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Y")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".map-builder-vertex")).toHaveLength(4);

    const firstEdge = container.querySelector(".map-builder-edge-hit");
    expect(firstEdge).toBeInTheDocument();

    await user.dblClick(firstEdge!);

    expect(container.querySelectorAll(".map-builder-vertex")).toHaveLength(5);
  });

  it("moves existing vertices and whole objects by dragging", async () => {
    const user = userEvent.setup();
    const { container } = render(<MapBuilderView gardenState={gardenState} onApplyGardenState={vi.fn()} />);
    const svg = screen.getByRole("img", { name: "Redigerbar kartbild" });
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      bottom: 568.2,
      height: 568.2,
      left: 0,
      right: 1000,
      top: 0,
      width: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const firstVertex = container.querySelector(".map-builder-vertex")!;
    fireEvent.pointerDown(firstVertex, { clientX: 80, clientY: 80, pointerId: 1 });
    fireEvent.pointerMove(firstVertex, { clientX: 200, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(firstVertex, { pointerId: 1 });
    expect(firstVertex).toHaveAttribute("cx", "20");
    expect(firstVertex).toHaveAttribute("cy", "12");

    await user.click(screen.getByRole("button", { name: "Gräsmatta" }));
    const lawn = container.querySelectorAll(".map-builder-element")[1];
    fireEvent.pointerDown(lawn, { clientX: 120, clientY: 120, pointerId: 2 });
    fireEvent.pointerMove(lawn, { clientX: 220, clientY: 150, pointerId: 2 });
    fireEvent.pointerUp(lawn, { pointerId: 2 });

    expect(lawn).toHaveAttribute("points", "22,15 98,15 98,51 22,51");
  });
});
