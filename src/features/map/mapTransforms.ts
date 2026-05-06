import type { Point } from "../../domain/models";

export function screenToNormalizedPoint(point: Point, bounds: DOMRect): Point {
  return {
    x: clamp(((point.x - bounds.left) / bounds.width) * 100),
    y: clamp(((point.y - bounds.top) / bounds.height) * 100),
  };
}

export function normalizedToSvgPoint(point: Point): string {
  return `${point.x},${point.y}`;
}

export function polygonToSvgPoints(points: Point[]): string {
  return points.map(normalizedToSvgPoint).join(" ");
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
