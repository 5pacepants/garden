import { createId } from "../../domain/ids";

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

export type GardenMapElementShape = "rectangle" | "ellipse";

export type GardenMapElement = {
  id: string;
  type: GardenMapElementType;
  name: string;
  shape: GardenMapElementShape;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

export type GardenMapLayout = {
  id: string;
  name: string;
  elements: GardenMapElement[];
};

const elementDefaults: Record<
  GardenMapElementType,
  Omit<GardenMapElement, "id" | "type">
> = {
  plot: { name: "Tomtgräns", shape: "rectangle", x: 8, y: 8, width: 84, height: 44, color: "#d9c8a4" },
  lawn: { name: "Gräsmatta", shape: "rectangle", x: 12, y: 12, width: 76, height: 36, color: "#b8d79c" },
  house: { name: "Hus", shape: "rectangle", x: 38, y: 18, width: 24, height: 14, color: "#d7d1c5" },
  path: { name: "Gång", shape: "rectangle", x: 45, y: 32, width: 10, height: 18, color: "#d8d0bd" },
  fence: { name: "Staket", shape: "rectangle", x: 8, y: 6, width: 84, height: 2, color: "#8d7358" },
  stone: { name: "Sten", shape: "ellipse", x: 20, y: 34, width: 7, height: 5, color: "#9b9b92" },
  tree: { name: "Träd", shape: "ellipse", x: 65, y: 30, width: 10, height: 10, color: "#6f9d5c" },
  shrub: { name: "Buske", shape: "ellipse", x: 26, y: 24, width: 8, height: 6, color: "#7fa86a" },
  deck: { name: "Altan", shape: "rectangle", x: 38, y: 32, width: 24, height: 8, color: "#c7a579" },
  water: { name: "Vatten", shape: "ellipse", x: 66, y: 38, width: 12, height: 7, color: "#8bbbd0" },
  other: { name: "Annat", shape: "rectangle", x: 20, y: 20, width: 12, height: 8, color: "#d6c37f" },
};

export function createStarterMapLayout(): GardenMapLayout {
  return {
    id: createId("map_layout"),
    name: "Ny trädgårdskarta",
    elements: [createMapElement("plot"), createMapElement("lawn")],
  };
}

export function createMapElement(type: GardenMapElementType): GardenMapElement {
  return {
    id: createId("map_element"),
    type,
    ...elementDefaults[type],
  };
}

export function updateMapElement(layout: GardenMapLayout, element: GardenMapElement): GardenMapLayout {
  return {
    ...layout,
    elements: layout.elements.map((existing) => (existing.id === element.id ? element : existing)),
  };
}

export function renderGardenMapLayoutDataUrl(layout: GardenMapLayout): string {
  return `data:image/svg+xml,${encodeURIComponent(renderGardenMapLayoutSvg(layout))}`;
}

export function renderGardenMapLayoutSvg(layout: GardenMapLayout): string {
  const elements = layout.elements.map(renderElement).join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 56.82" width="1663" height="945">`,
    `<rect width="100" height="56.82" fill="#f5f2e8"/>`,
    elements,
    `</svg>`,
  ].join("");
}

function renderElement(element: GardenMapElement): string {
  const label = escapeXml(element.name);
  const fill = escapeXml(element.color);

  if (element.shape === "ellipse") {
    return [
      `<ellipse cx="${element.x + element.width / 2}" cy="${element.y + element.height / 2}" rx="${element.width / 2}" ry="${element.height / 2}" fill="${fill}" stroke="#526052" stroke-width="0.18"/>`,
      renderLabel(label, element.x + element.width / 2, element.y + element.height / 2),
    ].join("");
  }

  return [
    `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="0.8" fill="${fill}" stroke="#526052" stroke-width="0.18"/>`,
    renderLabel(label, element.x + element.width / 2, element.y + element.height / 2),
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
