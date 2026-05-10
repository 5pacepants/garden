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
});
