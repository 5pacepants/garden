import { findContainingBed, worldToRelativePoint } from "../../domain/geometry";
import type { Bed, Plant, Point, Polygon, Zone } from "../../domain/models";

export function translatePolygon(polygon: Polygon, delta: Point): Polygon {
  return polygon.map((point) => ({
    x: clamp(point.x + delta.x),
    y: clamp(point.y + delta.y),
  }));
}

export function movePlantToPoint(plant: Plant, point: Point, beds: Bed[]): Plant {
  const clampedPoint = { x: clamp(point.x), y: clamp(point.y) };
  const containingBed = findContainingBed(clampedPoint, beds);

  return {
    ...plant,
    placement: containingBed
      ? {
          type: "bed",
          bedId: containingBed.id,
          relativePosition: worldToRelativePoint(clampedPoint, containingBed.polygon),
        }
      : {
          type: "map",
          position: clampedPoint,
        },
  };
}

export function moveBedToDelta(bed: Bed, delta: Point): Bed {
  return {
    ...bed,
    polygon: translatePolygon(bed.polygon, delta),
  };
}

export function moveZoneToDelta(zone: Zone, delta: Point): Zone {
  return {
    ...zone,
    polygon: translatePolygon(zone.polygon, delta),
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
