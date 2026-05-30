import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GardenState, Plant } from "../../src/domain/models";
import { GardenMap } from "../../src/features/map/GardenMap";
import { defaultPlantFilters } from "../../src/features/plants/PlantFilters";

const plant: Plant = {
  id: "plant-1",
  swedishName: "Lavendel",
  status: "planned",
  type: "perennial",
  placement: { type: "map", position: { x: 10, y: 10 } },
  needs: {},
  tags: [],
  careSchedule: [],
};

const gardenState: GardenState = {
  version: 1,
  map: { id: "map-1", name: "Karta" },
  beds: [],
  zones: [],
  plants: [plant],
  tasks: [],
  historyEvents: [],
  photos: [],
};

describe("GardenMap", () => {
  it("shows a map focus button over the lower right corner of the map", () => {
    const onOpenFocus = vi.fn();

    render(
      <GardenMap
        gardenState={gardenState}
        plantFilters={defaultPlantFilters}
        visiblePlantIds={new Set(["plant-1"])}
        onAddBed={vi.fn()}
        onAddPlant={vi.fn()}
        onAddZone={vi.fn()}
        onUpdateBed={vi.fn()}
        onUpdatePlant={vi.fn()}
        onUpdateZone={vi.fn()}
        onSelectionChange={vi.fn()}
        onOpenFocus={onOpenFocus}
        selection={null}
      />,
    );

    const button = screen.getByRole("button", { name: "Forstora karta" });
    expect(button).toHaveClass("map-focus-button");

    fireEvent.click(button);
    expect(onOpenFocus).toHaveBeenCalledOnce();
  });

  it("does not start a move from a plain click on a selected plant", () => {
    render(
      <GardenMap
        gardenState={gardenState}
        plantFilters={defaultPlantFilters}
        visiblePlantIds={new Set(["plant-1"])}
        onAddBed={vi.fn()}
        onAddPlant={vi.fn()}
        onAddZone={vi.fn()}
        onUpdateBed={vi.fn()}
        onUpdatePlant={vi.fn()}
        onUpdateZone={vi.fn()}
        onSelectionChange={vi.fn()}
        selection={{ type: "plant", id: "plant-1" }}
      />,
    );

    const plantNode = screen.getByRole("img").querySelector(".plant-circle") as SVGCircleElement;
    fireEvent.click(plantNode, { clientX: 100, clientY: 100 });

    expect(screen.queryByRole("button", { name: "Spara flytt" })).not.toBeInTheDocument();
  });

  it("renders the background image fitted to the full map instead of cropping it", async () => {
    const mediaService = {
      pickAndStoreImage: vi.fn(),
      resolveMediaUrl: vi.fn(async () => "asset://localhost/bakgrund.png"),
    };

    render(
      <GardenMap
        gardenState={{ ...gardenState, map: { ...gardenState.map, backgroundImage: "appmedia://bakgrund.png" } }}
        plantFilters={defaultPlantFilters}
        visiblePlantIds={new Set(["plant-1"])}
        onAddBed={vi.fn()}
        onAddPlant={vi.fn()}
        onAddZone={vi.fn()}
        onUpdateBed={vi.fn()}
        onUpdatePlant={vi.fn()}
        onUpdateZone={vi.fn()}
        onSelectionChange={vi.fn()}
        selection={null}
        mediaService={mediaService}
      />,
    );

    const backgroundImage = (await screen.findByRole("img")).querySelector(".map-background-image");

    expect(backgroundImage).toHaveAttribute("href", "asset://localhost/bakgrund.png");
    expect(backgroundImage).toHaveAttribute("x", "0");
    expect(backgroundImage).toHaveAttribute("y", "0");
    expect(backgroundImage).toHaveAttribute("width", "100");
    expect(backgroundImage).toHaveAttribute("height", "56.82");
    expect(backgroundImage).toHaveAttribute("preserveAspectRatio", "xMidYMid meet");
  });

  it("does not move a plant when layout changes between pointer down and pointer up without pointer movement", () => {
    render(
      <GardenMap
        gardenState={gardenState}
        plantFilters={defaultPlantFilters}
        visiblePlantIds={new Set(["plant-1"])}
        onAddBed={vi.fn()}
        onAddPlant={vi.fn()}
        onAddZone={vi.fn()}
        onUpdateBed={vi.fn()}
        onUpdatePlant={vi.fn()}
        onUpdateZone={vi.fn()}
        onSelectionChange={vi.fn()}
        selection={{ type: "plant", id: "plant-1" }}
      />,
    );

    const svg = screen.getByRole("img");
    const firstRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 568.2,
      bottom: 568.2,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;
    const shiftedRect = {
      ...firstRect,
      top: -100,
      bottom: 468.2,
      y: -100,
    } as DOMRect;
    const rectSpy = vi.spyOn(svg, "getBoundingClientRect");
    rectSpy.mockReturnValueOnce(firstRect).mockReturnValue(shiftedRect);

    const plantNode = svg.querySelector(".plant-circle") as SVGCircleElement;
    fireEvent.pointerDown(plantNode, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(svg, { clientX: 100, clientY: 100, pointerId: 1 });

    expect(screen.queryByRole("button", { name: "Spara flytt" })).not.toBeInTheDocument();
    expect(plantNode.getAttribute("cx")).toBe("10");
    expect(plantNode.getAttribute("cy")).toBe("10");
  });

  it("keeps a dragged plant at the release point until the move is saved", () => {
    const onUpdatePlant = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <GardenMap
        gardenState={gardenState}
        plantFilters={defaultPlantFilters}
        visiblePlantIds={new Set(["plant-1"])}
        onAddBed={vi.fn()}
        onAddPlant={vi.fn()}
        onAddZone={vi.fn()}
        onUpdateBed={vi.fn()}
        onUpdatePlant={onUpdatePlant}
        onUpdateZone={vi.fn()}
        onSelectionChange={onSelectionChange}
        selection={{ type: "plant", id: "plant-1" }}
      />,
    );

    const svg = screen.getByRole("img");
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 568.2,
      bottom: 568.2,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const plantNode = svg.querySelector(".plant-circle") as SVGCircleElement;
    fireEvent.pointerDown(plantNode, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(svg, { buttons: 1, clientX: 500, clientY: 284.1, pointerId: 1 });
    fireEvent.pointerUp(svg, { clientX: 500, clientY: 284.1, pointerId: 1 });
    fireEvent.click(plantNode, { clientX: 500, clientY: 284.1 });

    expect(plantNode.getAttribute("cx")).toBe("50");
    expect(plantNode.getAttribute("cy")).toBe("28.41");

    fireEvent.click(screen.getByRole("button", { name: "Spara flytt" }));

    expect(onUpdatePlant).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: { type: "map", position: { x: 50, y: 28.41 } },
      }),
    );
  });

  it("uses the release point when no pointer move event has updated the draft", () => {
    render(
      <GardenMap
        gardenState={gardenState}
        plantFilters={defaultPlantFilters}
        visiblePlantIds={new Set(["plant-1"])}
        onAddBed={vi.fn()}
        onAddPlant={vi.fn()}
        onAddZone={vi.fn()}
        onUpdateBed={vi.fn()}
        onUpdatePlant={vi.fn()}
        onUpdateZone={vi.fn()}
        onSelectionChange={vi.fn()}
        selection={{ type: "plant", id: "plant-1" }}
      />,
    );

    const svg = screen.getByRole("img");
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 568.2,
      bottom: 568.2,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const plantNode = svg.querySelector(".plant-circle") as SVGCircleElement;
    fireEvent.pointerDown(plantNode, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(svg, { clientX: 500, clientY: 284.1, pointerId: 1 });

    expect(plantNode.getAttribute("cx")).toBe("50");
    expect(plantNode.getAttribute("cy")).toBe("28.41");
    expect(screen.getByRole("button", { name: "Spara flytt" })).toBeInTheDocument();
  });

  it("stops following the pointer after the mouse button is released", () => {
    render(
      <GardenMap
        gardenState={gardenState}
        plantFilters={defaultPlantFilters}
        visiblePlantIds={new Set(["plant-1"])}
        onAddBed={vi.fn()}
        onAddPlant={vi.fn()}
        onAddZone={vi.fn()}
        onUpdateBed={vi.fn()}
        onUpdatePlant={vi.fn()}
        onUpdateZone={vi.fn()}
        onSelectionChange={vi.fn()}
        selection={{ type: "plant", id: "plant-1" }}
      />,
    );

    const svg = screen.getByRole("img");
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 568.2,
      bottom: 568.2,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const plantNode = svg.querySelector(".plant-circle") as SVGCircleElement;
    fireEvent.pointerDown(plantNode, { buttons: 1, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(svg, { buttons: 1, clientX: 500, clientY: 284.1, pointerId: 1 });
    fireEvent.pointerMove(svg, { buttons: 0, clientX: 600, clientY: 340.92, pointerId: 1 });
    fireEvent.pointerMove(svg, { buttons: 0, clientX: 800, clientY: 454.56, pointerId: 1 });

    expect(plantNode.getAttribute("cx")).toBe("60");
    expect(plantNode.getAttribute("cy")).toBe("34.092");
  });

  it("shows a non-blocking warning when a moved plant does not match the target zone", () => {
    render(
      <GardenMap
        gardenState={{
          ...gardenState,
          zones: [
            {
              id: "zone-shade",
              name: "Skugga",
              polygon: [
                { x: 40, y: 20 },
                { x: 70, y: 20 },
                { x: 70, y: 45 },
                { x: 40, y: 45 },
              ],
              light: "shade",
            },
          ],
          plants: [{ ...plant, needs: { light: ["sun"] } }],
        }}
        plantFilters={defaultPlantFilters}
        visiblePlantIds={new Set(["plant-1"])}
        onAddBed={vi.fn()}
        onAddPlant={vi.fn()}
        onAddZone={vi.fn()}
        onUpdateBed={vi.fn()}
        onUpdatePlant={vi.fn()}
        onUpdateZone={vi.fn()}
        onSelectionChange={vi.fn()}
        selection={{ type: "plant", id: "plant-1" }}
      />,
    );

    const svg = screen.getByRole("img");
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 568.2,
      bottom: 568.2,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const plantNode = svg.querySelector(".plant-circle") as SVGCircleElement;
    fireEvent.pointerDown(plantNode, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(svg, { clientX: 500, clientY: 284.1, pointerId: 1 });

    expect(screen.getByText(/Lavendel verkar inte passa perfekt/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spara flytt" })).toBeInTheDocument();
  });
});
