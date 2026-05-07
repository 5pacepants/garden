import { describe, expect, it } from "vitest";
import {
  findContainingBed,
  findZonesAtPoint,
  getBoundingBox,
  pointInPolygon,
  relativeToWorldPoint,
  scaleRelativePoint,
  worldToRelativePoint,
} from "../../src/domain/geometry";
import type { Bed, Zone } from "../../src/domain/models";

describe("geometry", () => {
  it("detects whether a plant point is inside a bed polygon", () => {
    const bed = [
      { x: 10, y: 10 },
      { x: 50, y: 10 },
      { x: 50, y: 50 },
      { x: 10, y: 50 },
    ];

    expect(pointInPolygon({ x: 25, y: 25 }, bed)).toBe(true);
    expect(pointInPolygon({ x: 75, y: 25 }, bed)).toBe(false);
  });

  it("calculates a polygon bounding box", () => {
    const polygon = [
      { x: 20, y: 80 },
      { x: 60, y: 20 },
      { x: 45, y: 90 },
    ];

    expect(getBoundingBox(polygon)).toEqual({
      minX: 20,
      minY: 20,
      maxX: 60,
      maxY: 90,
      width: 40,
      height: 70,
    });
  });

  it("round-trips a plant point through bed-relative coordinates", () => {
    const polygon = [
      { x: 20, y: 20 },
      { x: 60, y: 20 },
      { x: 60, y: 80 },
      { x: 20, y: 80 },
    ];

    const relative = worldToRelativePoint({ x: 40, y: 50 }, polygon);

    expect(relative).toEqual({ x: 0.5, y: 0.5 });
    expect(relativeToWorldPoint(relative, polygon)).toEqual({ x: 40, y: 50 });
  });

  it("keeps a plant in the same relative position when a bed scales", () => {
    expect(scaleRelativePoint({ x: 0.25, y: 0.75 })).toEqual({ x: 0.25, y: 0.75 });
  });

  it("finds the topmost containing bed", () => {
    const beds: Bed[] = [
      {
        id: "bed_a",
        name: "A",
        polygon: [
          { x: 0, y: 0 },
          { x: 80, y: 0 },
          { x: 80, y: 80 },
          { x: 0, y: 80 },
        ],
      },
      {
        id: "bed_b",
        name: "B",
        polygon: [
          { x: 20, y: 20 },
          { x: 60, y: 20 },
          { x: 60, y: 60 },
          { x: 20, y: 60 },
        ],
      },
    ];

    expect(findContainingBed({ x: 30, y: 30 }, beds)?.id).toBe("bed_b");
  });

  it("finds all zones under a point", () => {
    const zones: Zone[] = [
      {
        id: "sun",
        name: "Sun",
        light: "sun",
        polygon: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 50 },
          { x: 0, y: 50 },
        ],
      },
      {
        id: "dry",
        name: "Dry",
        moisture: "dry",
        polygon: [
          { x: 25, y: 25 },
          { x: 75, y: 25 },
          { x: 75, y: 75 },
          { x: 25, y: 75 },
        ],
      },
    ];

    expect(findZonesAtPoint({ x: 30, y: 30 }, zones).map((zone) => zone.id)).toEqual(["sun", "dry"]);
  });
});

