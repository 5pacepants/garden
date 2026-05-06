import type { Bed, Point, Polygon, Zone } from "./models";

export type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

export function pointInPolygon(point: Point, polygon: Polygon): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const current = polygon[i];
    const previous = polygon[j];
    const crossesY = current.y > point.y !== previous.y > point.y;
    const intersectionX =
      ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x;

    if (crossesY && point.x < intersectionX) {
      inside = !inside;
    }
  }

  return inside;
}

export function getBoundingBox(polygon: Polygon): BoundingBox {
  if (polygon.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const xs = polygon.map((point) => point.x);
  const ys = polygon.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function worldToRelativePoint(point: Point, polygon: Polygon): Point {
  const box = getBoundingBox(polygon);

  return {
    x: box.width === 0 ? 0 : (point.x - box.minX) / box.width,
    y: box.height === 0 ? 0 : (point.y - box.minY) / box.height,
  };
}

export function relativeToWorldPoint(point: Point, polygon: Polygon): Point {
  const box = getBoundingBox(polygon);

  return {
    x: box.minX + point.x * box.width,
    y: box.minY + point.y * box.height,
  };
}

export function scaleRelativePoint(point: Point): Point {
  return { ...point };
}

export function findContainingBed(point: Point, beds: Bed[]): Bed | undefined {
  return [...beds].reverse().find((bed) => pointInPolygon(point, bed.polygon));
}

export function findZonesAtPoint(point: Point, zones: Zone[]): Zone[] {
  return zones.filter((zone) => pointInPolygon(point, zone.polygon));
}
