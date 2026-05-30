import { createId } from "../../domain/ids";
import type { Point, SavedMapImage } from "../../domain/models";
import { polygonToSvgPoints } from "../map/mapTransforms";

export type GardenMapElementType =
  | "plot"
  | "house"
  | "path"
  | "lawn"
  | "fence"
  | "stone"
  | "tree"
  | "shrub"
  | "deck"
  | "water"
  | "other";

export type GardenMapElement = {
  id: string;
  type: GardenMapElementType;
  name: string;
  points: Point[];
  color: string;
};

export type GardenMapLayout = {
  id: string;
  name: string;
  elements: GardenMapElement[];
};

export type SavedBuilderMapImage = SavedMapImage & {
  source: "builder";
  layout: GardenMapLayout;
};

const elementDefaults: Record<GardenMapElementType, Omit<GardenMapElement, "id" | "type">> = {
  plot: { name: "Tomtgräns", points: rectanglePoints(8, 8, 84, 44), color: "#d9c8a4" },
  lawn: { name: "Gräsmatta", points: rectanglePoints(12, 12, 76, 36), color: "#b8d79c" },
  house: { name: "Hus", points: rectanglePoints(38, 18, 24, 14), color: "#d7d1c5" },
  path: { name: "Gång", points: rectanglePoints(45, 32, 10, 18), color: "#d8d0bd" },
  fence: { name: "Staket", points: rectanglePoints(8, 6, 84, 2), color: "#8d7358" },
  stone: { name: "Sten", points: ellipsePoints(23.5, 36.5, 3.5, 2.5), color: "#9b9b92" },
  tree: { name: "Träd", points: ellipsePoints(70, 35, 5, 5), color: "#6f9d5c" },
  shrub: { name: "Buske", points: ellipsePoints(30, 27, 4, 3), color: "#7fa86a" },
  deck: { name: "Altan", points: rectanglePoints(38, 32, 24, 8), color: "#c7a579" },
  water: { name: "Vatten", points: ellipsePoints(72, 41.5, 6, 3.5), color: "#8bbbd0" },
  other: { name: "Annat", points: rectanglePoints(20, 20, 12, 8), color: "#d6c37f" },
};

export function createStarterMapLayout(): GardenMapLayout {
  return {
    id: createId("map_layout"),
    name: "Ny trädgårdskarta",
    elements: [createMapElement("plot"), createMapElement("lawn")],
  };
}

export function createMapElement(type: GardenMapElementType): GardenMapElement {
  const defaults = elementDefaults[type];

  return {
    id: createId("map_element"),
    type,
    ...defaults,
    points: defaults.points.map((point) => ({ ...point })),
  };
}

export function updateMapElement(layout: GardenMapLayout, element: GardenMapElement): GardenMapLayout {
  return {
    ...layout,
    elements: layout.elements.map((existing) => (existing.id === element.id ? element : existing)),
  };
}

export function moveMapElementPoint(element: GardenMapElement, pointIndex: number, point: Point): GardenMapElement {
  return {
    ...element,
    points: element.points.map((existing, index) =>
      index === pointIndex
        ? {
            x: clamp(point.x),
            y: clamp(point.y, 56.82),
          }
        : existing,
    ),
  };
}

export function moveMapElementByDelta(element: GardenMapElement, delta: Point): GardenMapElement {
  return {
    ...element,
    points: element.points.map((point) => ({
      x: clamp(point.x + delta.x),
      y: clamp(point.y + delta.y, 56.82),
    })),
  };
}

export function insertMapElementPoint(element: GardenMapElement, edgeStartIndex: number, point: Point): GardenMapElement {
  const insertAfter = Math.max(0, Math.min(edgeStartIndex, element.points.length - 1));
  const nextPoint = {
    x: clamp(point.x),
    y: clamp(point.y, 56.82),
  };

  return {
    ...element,
    points: [...element.points.slice(0, insertAfter + 1), nextPoint, ...element.points.slice(insertAfter + 1)],
  };
}

export function getMapElementCenter(element: GardenMapElement): Point {
  const total = element.points.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / element.points.length,
    y: total.y / element.points.length,
  };
}

export function renderGardenMapLayoutDataUrl(layout: GardenMapLayout): string {
  return `data:image/svg+xml,${encodeURIComponent(renderGardenMapLayoutSvg(layout))}`;
}

export function renderGardenMapLayoutSvg(layout: GardenMapLayout): string {
  const elements = layout.elements.map((element) => renderElement(element)).join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 56.82" width="1663" height="945">`,
    `<rect width="100" height="56.82" fill="#f5f2e8"/>`,
    elements,
    `</svg>`,
  ].join("");
}

export function saveLayoutAsMapImage(layout: GardenMapLayout): SavedBuilderMapImage {
  return {
    id: createId("map_image"),
    name: layout.name.trim() || "Kartbild",
    image: renderGardenMapLayoutDataUrl(layout),
    source: "builder",
    createdAt: new Date().toISOString(),
    layout: cloneLayout(layout),
  };
}

export function cloneLayout(layout: GardenMapLayout): GardenMapLayout {
  return {
    ...layout,
    elements: layout.elements.map((element) => ({
      ...element,
      points: element.points.map((point) => ({ ...point })),
    })),
  };
}

function renderElement(element: GardenMapElement): string {
  const label = escapeXml(element.name);
  const fill = escapeXml(element.color);
  const center = getMapElementCenter(element);

  return [
    `<polygon points="${polygonToSvgPoints(element.points)}" fill="${fill}" stroke="#526052" stroke-width="0.18"/>`,
    renderLabel(label, center.x, center.y),
  ].join("");
}

function renderLabel(label: string, x: number, y: number): string {
  return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, Arial, sans-serif" font-size="2.2" fill="#203229">${label}</text>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rectanglePoints(x: number, y: number, width: number, height: number): Point[] {
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

function ellipsePoints(cx: number, cy: number, rx: number, ry: number): Point[] {
  return Array.from({ length: 8 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 8;

    return {
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    };
  });
}

function clamp(value: number, max = 100): number {
  return Math.max(0, Math.min(max, value));
}
