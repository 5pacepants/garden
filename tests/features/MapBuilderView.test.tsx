import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  afterEach(() => {
    vi.useRealTimers();
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
    delete window.matchMedia;
  });

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

  it("can add multiple lawn areas", async () => {
    const user = userEvent.setup();

    render(<MapBuilderView gardenState={gardenState} onApplyGardenState={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Lägg till gräsmatta" }));
    await user.click(screen.getByRole("button", { name: "Lägg till gräsmatta" }));

    expect(screen.getAllByRole("button", { name: "Gräsmatta" })).toHaveLength(3);
  });

  it("saves the current builder layout as a reusable map image", async () => {
    const user = userEvent.setup();
    const onSaveMapImage = vi.fn();

    render(<MapBuilderView gardenState={gardenState} onApplyGardenState={vi.fn()} onSaveMapImage={onSaveMapImage} />);

    await user.click(screen.getByRole("button", { name: "Spara" }));

    expect(onSaveMapImage).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "builder",
        image: expect.stringMatching(/^data:image\/svg\+xml,/),
        layout: expect.objectContaining({ elements: expect.any(Array) }),
      }),
    );
  });

  it("does not offer AI map image generation", () => {
    render(<MapBuilderView gardenState={gardenState} onApplyGardenState={vi.fn()} onSaveMapImage={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "AI-fixa bild" })).not.toBeInTheDocument();
    expect(screen.queryByText("AI fixar...")).not.toBeInTheDocument();
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

  it("keeps plot handles above later map objects so they can be dragged", () => {
    const { container } = render(<MapBuilderView gardenState={gardenState} onApplyGardenState={vi.fn()} />);

    const lawnShape = container.querySelectorAll(".map-builder-element")[1];
    const firstPlotVertex = container.querySelector(".map-builder-vertex")!;

    expect(lawnShape.compareDocumentPosition(firstPlotVertex) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps every edge hit area below every vertex handle", () => {
    const { container } = render(<MapBuilderView gardenState={gardenState} onApplyGardenState={vi.fn()} />);

    const lastEdge = Array.from(container.querySelectorAll(".map-builder-edge-hit")).at(-1)!;
    const firstVertex = container.querySelector(".map-builder-vertex")!;

    expect(lastEdge.compareDocumentPosition(firstVertex) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

  it("moves a selected fence when dragging from its edge hit area", async () => {
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

    await userEvent.click(screen.getByRole("button", { name: /staket/i }));

    const fence = Array.from(container.querySelectorAll(".map-builder-element")).at(-1)!;
    const firstFenceEdge = container.querySelector(".map-builder-edge-hit")!;
    fireEvent.pointerDown(firstFenceEdge, { clientX: 80, clientY: 60, pointerId: 3 });
    fireEvent.pointerMove(svg, { clientX: 180, clientY: 110, pointerId: 3 });
    fireEvent.pointerUp(svg, { pointerId: 3 });

    expect(fence).toHaveAttribute("points", "18,11 100,11 100,13 18,13");
  });

  it("opens a mobile add menu on double tap and inserts the chosen element there", async () => {
    const user = userEvent.setup();
    mockMobileViewport();
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

    fireEvent.pointerUp(svg, { clientX: 300, clientY: 160, pointerId: 1, pointerType: "touch" });
    expect(screen.queryByRole("dialog", { name: "Välj objekt att lägga till" })).not.toBeInTheDocument();

    fireEvent.pointerUp(svg, { clientX: 300, clientY: 160, pointerId: 1, pointerType: "touch" });

    const dialog = screen.getByRole("dialog", { name: "Välj objekt att lägga till" });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Lägg till hus" }));

    expect(screen.queryByRole("dialog", { name: "Välj objekt att lägga till" })).not.toBeInTheDocument();
    expect(container.querySelectorAll(".map-builder-element")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Hus" })).toBeInTheDocument();
  });

  it("opens the wide mobile preview when the expand button is pressed", async () => {
    const user = userEvent.setup();
    mockMobileViewport();

    render(<MapBuilderView gardenState={gardenState} onApplyGardenState={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Förstora karta" }));

    expect(screen.getByRole("dialog", { name: "Förstorad karta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stäng" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lägg till hus" })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("keeps the normal mobile builder scrollable until the wide preview is opened", () => {
    mockMobileViewport();

    render(<MapBuilderView gardenState={gardenState} onApplyGardenState={vi.fn()} />);

    expect(document.body.style.overflow).toBe("");
  });
});

function mockMobileViewport() {
  window.matchMedia = ((query: string) => ({
    matches: query === "(max-width: 760px)",
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
