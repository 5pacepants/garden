import { describe, expect, it } from "vitest";
import {
  createMapElement,
  createStarterMapLayout,
  renderGardenMapLayoutDataUrl,
  renderGardenMapLayoutSvg,
  updateMapElement,
} from "../../src/features/mapBuilder/mapBuilderModel";

describe("map builder model", () => {
  it("creates a starter layout with a plot and lawn", () => {
    const layout = createStarterMapLayout();

    expect(layout.elements.map((element) => element.type)).toEqual(["plot", "lawn"]);
  });

  it("creates useful default elements", () => {
    const element = createMapElement("house");

    expect(element).toEqual(
      expect.objectContaining({
        type: "house",
        name: "Hus",
        shape: "rectangle",
        x: expect.any(Number),
        y: expect.any(Number),
      }),
    );
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
    expect(svg).toContain("Hus &amp; garage");
    expect(renderGardenMapLayoutDataUrl(layout)).toMatch(/^data:image\/svg\+xml,/);
  });
});
