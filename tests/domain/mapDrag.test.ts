import { describe, expect, it } from "vitest";
import type { Bed, Plant } from "../../src/domain/models";
import { movePlantToPoint, translatePolygon } from "../../src/features/map/mapDrag";

const bed: Bed = {
  id: "bed-1",
  name: "Rabatt",
  polygon: [
    { x: 10, y: 10 },
    { x: 40, y: 10 },
    { x: 40, y: 40 },
    { x: 10, y: 40 },
  ],
};

const plant: Plant = {
  id: "plant-1",
  swedishName: "Lavendel",
  status: "planned",
  type: "perennial",
  placement: { type: "map", position: { x: 80, y: 80 } },
  needs: {},
  tags: [],
  careSchedule: [],
};

describe("map drag helpers", () => {
  it("stores bed-relative placement when a plant is dropped inside a bed", () => {
    const moved = movePlantToPoint(plant, { x: 25, y: 25 }, [bed]);

    expect(moved.placement.type).toBe("bed");
    if (moved.placement.type === "bed") {
      expect(moved.placement.bedId).toBe("bed-1");
      expect(moved.placement.relativePosition).toEqual({ x: 0.5, y: 0.5 });
    }
  });

  it("stores map placement when a plant is dropped outside beds", () => {
    const moved = movePlantToPoint(plant, { x: 80, y: 80 }, [bed]);

    expect(moved.placement).toEqual({ type: "map", position: { x: 80, y: 80 } });
  });

  it("translates polygon points by a clamped delta", () => {
    expect(translatePolygon(bed.polygon, { x: 5, y: -5 })[0]).toEqual({ x: 15, y: 5 });
    expect(translatePolygon(bed.polygon, { x: -50, y: -50 })[0]).toEqual({ x: 0, y: 0 });
  });
});
