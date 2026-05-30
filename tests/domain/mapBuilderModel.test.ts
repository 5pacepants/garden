import { describe, expect, it } from "vitest";
import {
  createMapElement,
  createStarterMapLayout,
  insertMapElementPoint,
  moveMapElementByDelta,
  moveMapElementPoint,
  renderGardenMapLayoutDataUrl,
  renderGardenMapLayoutSvg,
  saveLayoutAsMapImage,
  updateMapElement,
} from "../../src/features/mapBuilder/mapBuilderModel";

describe("map builder model", () => {
  it("creates a starter layout with a plot and lawn", () => {
    const layout = createStarterMapLayout();

    expect(layout.elements.map((element) => element.type)).toEqual(["plot", "lawn"]);
    expect(layout.elements[0].points).toHaveLength(4);
  });

  it("creates useful default elements as editable point shapes", () => {
    const element = createMapElement("house");

    expect(element).toEqual(
      expect.objectContaining({
        type: "house",
        name: "Hus",
        points: [
          { x: expect.any(Number), y: expect.any(Number) },
          { x: expect.any(Number), y: expect.any(Number) },
          { x: expect.any(Number), y: expect.any(Number) },
          { x: expect.any(Number), y: expect.any(Number) },
        ],
      }),
    );
  });

  it("moves one editable point without moving the rest", () => {
    const element = createMapElement("house");
    const moved = moveMapElementPoint(element, 1, { x: 110, y: -5 });

    expect(moved.points[1]).toEqual({ x: 100, y: 0 });
    expect(moved.points[0]).toBe(element.points[0]);
    expect(moved.points[2]).toBe(element.points[2]);
  });

  it("moves a whole element by dragging its shape", () => {
    const element = createMapElement("lawn");
    const moved = moveMapElementByDelta(element, { x: 3, y: -2 });

    expect(moved.points[0]).toEqual({
      x: element.points[0].x + 3,
      y: element.points[0].y - 2,
    });
    expect(moved.points[1]).toEqual({
      x: element.points[1].x + 3,
      y: element.points[1].y - 2,
    });
  });

  it("inserts a new point after a double-clicked edge, including the plot shape", () => {
    const plot = createMapElement("plot");
    const updated = insertMapElementPoint(plot, 0, { x: 50, y: 4 });

    expect(updated.points).toHaveLength(5);
    expect(updated.points[1]).toEqual({ x: 50, y: 4 });
  });

  it("updates one element without replacing the whole layout", () => {
    const layout = createStarterMapLayout();
    const updated = updateMapElement(layout, { ...layout.elements[0], name: "Min tomt" });

    expect(updated.elements[0].name).toBe("Min tomt");
    expect(updated.elements[1]).toBe(layout.elements[1]);
  });

  it("renders an escaped SVG and data URL", () => {
    const layout = {
      ...createStarterMapLayout(),
      elements: [{ ...createMapElement("house"), name: "Hus & garage" }],
    };

    const svg = renderGardenMapLayoutSvg(layout);

    expect(svg).toContain("<svg");
    expect(svg).toContain("<polygon");
    expect(svg).toContain("Hus &amp; garage");
    expect(renderGardenMapLayoutDataUrl(layout)).toMatch(/^data:image\/svg\+xml,/);
  });

  it("saves a layout as an editable map image with its rendered SVG", () => {
    const layout = {
      ...createStarterMapLayout(),
      name: "Entrekarta",
      elements: [{ ...createMapElement("house"), color: "#ff8844" }],
    };

    const saved = saveLayoutAsMapImage(layout);

    expect(saved).toEqual(
      expect.objectContaining({
        name: "Entrekarta",
        source: "builder",
        image: expect.stringMatching(/^data:image\/svg\+xml,/),
        layout: expect.objectContaining({
          elements: [expect.objectContaining({ type: "house", color: "#ff8844" })],
        }),
      }),
    );
  });
});
